import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Miniflare } from 'miniflare';
import { digest } from '../src/runtime/input.mjs';

const now = Math.floor(Date.now() / 1000) - 60;
const tokenA = randomBytes(32).toString('base64url');
const tokenB = randomBytes(32).toString('base64url');
const registry = { version: 1, credentials: [
  { sha256: await digest(tokenA), coreId: 'test-owner-a', expiresAt: now + 3600, revoked: false },
  { sha256: await digest(tokenB), coreId: 'test-owner-b', expiresAt: now + 3600, revoked: false },
] };
const config = {
  modules: true, scriptPath: fileURLToPath(new URL('../src/runtime/worker.mjs', import.meta.url)),
  compatibilityDate: '2026-07-30',
  durableObjects: { PLAYER_CORES: { className: 'PlayerCore', useSQLite: true } },
  bindings: { PAIRING_REGISTRY: JSON.stringify(registry) },
};
function snapshot(coreId = 'test-owner-a', changes = {}) {
  return { version: 1, character: { coreId, game: 'test-beta', realm: 'us:Example Realm',
    guid: 'Example-1' }, observedAt: now, source: { kind: 'addon', version: 'test-v1' },
  sections: { identity: { name: 'Example', secondName: 'Surname', class: 'Druid', faction: 'Horde' },
    progression: { level: 12 }, professions: [{ name: 'Alchemy', skill: 20, maxSkill: 75 }] }, ...changes };
}
const query = value => new URLSearchParams({ game: value.game, realm: value.realm, guid: value.guid });
async function call(mf, path, { token = tokenA, method = 'GET', body, headers = {} } = {}) {
  const response = await mf.dispatchFetch('https://core.example' + path, { method,
    headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json(), headers: response.headers };
}
test('Cloudflare runtime: private sync, onboarding, notes, isolation and restart', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'wow-core-runtime-'));
  let mf = new Miniflare({ ...config, durableObjectsPersist: directory });
  t.after(async () => { await mf.dispose(); await rm(directory, { recursive: true, force: true }); });

  await t.test('public health has no private data; missing/unknown keys denied', async () => {
    const health = await call(mf, '/health', { token: null });
    assert.deepEqual(health.body, { service: 'wow-core', version: 1 });
    assert.equal(health.headers.get('Cache-Control'), 'no-store');
    assert.equal((await call(mf, '/v1/characters', { token: null })).status, 401);
    assert.equal((await call(mf, '/v1/characters', { token: randomBytes(32).toString('base64url') })).status, 401);
  });
  await t.test('first sync creates canonical record and empty template, including second name', async () => {
    const result = await call(mf, '/v1/sync', { method: 'POST', body: snapshot() });
    assert.equal(result.status, 201); assert.equal(result.body.created, true);
    assert.equal(result.body.record.sections.identity.secondName, 'Surname');
    assert.deepEqual(result.body.record.modules, { version: 1, identity: {}, macros: [],
      macroBuilder: {}, travel: {}, notes: [] });
    const roster = await call(mf, '/v1/characters');
    assert.equal(roster.body.characters.length, 1);
    assert.equal(roster.body.characters[0].character.coreId, 'test-owner-a');
    assert.equal('modules' in roster.body.characters[0], false);
  });
  await t.test('independent owners cannot choose each other through payload, query or headers', async () => {
    assert.equal((await call(mf, '/v1/characters', { token: tokenB })).body.characters.length, 0);
    assert.equal((await call(mf, '/v1/sync', { token: tokenB, method: 'POST', body: snapshot() })).status, 403);
    assert.equal((await call(mf, '/v1/characters?coreId=test-owner-a', { token: tokenB })).status, 400);
    assert.equal((await call(mf, '/v1/character?' + query(snapshot().character), { token: tokenB })).status, 404);
    assert.equal((await call(mf, '/v1/characters', { token: tokenB,
      headers: { 'X-Core-Id': 'test-owner-a', 'X-Role': 'owner' } })).body.characters.length, 0);
    const result = await call(mf, '/v1/sync', { token: tokenB, method: 'POST', body: snapshot('test-owner-b') });
    assert.equal(result.status, 201); assert.equal(result.body.record.revision, 1);
  });
  await t.test('repeat is idempotent; stale or conflicting observation denied', async () => {
    const repeated = await call(mf, '/v1/sync', { method: 'POST', body: snapshot() });
    assert.equal(repeated.body.unchanged, true); assert.equal(repeated.body.record.revision, 1);
    assert.equal((await call(mf, '/v1/sync', { method: 'POST', body: snapshot(undefined,
      { observedAt: now - 1 }) })).status, 409);
    const conflict = snapshot(); conflict.sections.progression.level = 13;
    assert.equal((await call(mf, '/v1/sync', { method: 'POST', body: conflict })).status, 409);
    const reordered = snapshot(); reordered.sections = { progression: reordered.sections.progression,
      professions: reordered.sections.professions, identity: reordered.sections.identity };
    assert.equal((await call(mf, '/v1/sync', { method: 'POST', body: reordered })).body.unchanged, true);
  });
  await t.test('manual notes survive newer sync; missing section stays explicitly older', async () => {
    const result = await call(mf, '/v1/character/notes?' + query(snapshot().character),
      { method: 'PUT', body: { expectedRevision: 1, notes: ['Invented private note'] } });
    assert.equal(result.body.record.revision, 2);
    const newer = snapshot(undefined, { observedAt: now + 1 }); delete newer.sections.professions;
    const saved = await call(mf, '/v1/sync', { method: 'POST', body: newer });
    assert.equal(saved.body.record.revision, 3);
    assert.deepEqual(saved.body.record.modules.notes, ['Invented private note']);
    assert.equal(saved.body.record.sectionObservedAt.professions, now);
    assert.equal(saved.body.record.sectionObservedAt.identity, now + 1);
    assert.equal((await call(mf, '/v1/character/notes?' + query(snapshot().character),
      { method: 'PUT', body: { expectedRevision: 2, notes: [] } })).status, 409);
    assert.equal((await call(mf, '/v1/character/notes?' + query(snapshot().character),
      { token: tokenB, method: 'PUT', body: { expectedRevision: 3, notes: ['Cannot change other owner'] } })).status, 409);
  });
  await t.test('beta/release/realm/GUID separate even with reused display names', async () => {
    for (const change of [{ game: 'test-release' }, { realm: 'eu:Example Realm' }, { guid: 'Example-2' }]) {
      const value = snapshot(); Object.assign(value.character, change);
      assert.equal((await call(mf, '/v1/sync', { method: 'POST', body: value })).status, 201);
    }
    const result = await call(mf, '/v1/characters?game=test-release&faction=Horde');
    assert.equal(result.body.characters.length, 1);
    const record = await call(mf, '/v1/character?' + query(result.body.characters[0].character));
    assert.deepEqual(record.body.record.modules.notes, []);
  });
  await t.test('bounded keyset pagination yields canonical summaries only', async () => {
    const first = await call(mf, '/v1/characters?limit=2');
    const second = await call(mf, '/v1/characters?limit=2&after=' + encodeURIComponent(first.body.nextCursor));
    assert.equal(first.body.characters.length, 2); assert.equal(second.body.characters.length, 2);
    assert.equal(second.body.nextCursor, null);
    assert.equal(new Set([...first.body.characters, ...second.body.characters]
      .map(row => JSON.stringify(row.character))).size, 4);
    assert.equal((await call(mf, '/v1/characters?limit=99')).status, 400);
    assert.equal((await call(mf, '/v1/characters?game=test-beta&game=test-release')).status, 400);
  });
  await t.test('malformed/oversized/unsupported fields fail without private diagnostics', async () => {
    const wrong = snapshot(); wrong.sections.privateChat = ['not accepted'];
    const result = await call(mf, '/v1/sync', { method: 'POST', body: wrong });
    assert.deepEqual(result.body, { error: 'invalid_contract' });
    assert.equal((await call(mf, '/v1/sync', { method: 'POST', body: { arbitrary: 'x'.repeat(66000) } })).status, 413);
    assert.equal((await call(mf, '/v1/sync', { method: 'POST', body: snapshot(),
      headers: { 'Content-Type': 'text/plain' } })).status, 415);
    assert.equal((await call(mf, '/v1/characters', { headers: { Origin: 'https://other.example' } })).status, 403);
    assert.equal((await call(mf, '/v1/sync', { method: 'POST', body: snapshot(undefined,
      { observedAt: now + 100000 }) })).status, 400);
  });
  await t.test('concurrent arrivals never regress to older observation', async () => {
    const results = await Promise.all([5, 3, 4, 2].map(step => call(mf, '/v1/sync',
      { method: 'POST', body: snapshot(undefined, { observedAt: now + step }) })));
    assert.ok(results.every(result => [200, 409].includes(result.status)));
    const record = await call(mf, '/v1/character?' + query(snapshot().character));
    assert.equal(record.body.record.observedAt, now + 5);
  });
  await t.test('durable records persist after runtime restart', async () => {
    await mf.dispose(); mf = new Miniflare({ ...config, durableObjectsPersist: directory });
    const record = await call(mf, '/v1/character?' + query(snapshot().character));
    assert.equal(record.status, 200); assert.equal(record.body.record.observedAt, now + 5);
    assert.deepEqual(record.body.record.modules.notes, ['Invented private note']);
    assert.equal((await call(mf, '/v1/characters', { token: tokenB })).body.characters.length, 1);
  });
  await t.test('revocation blocks future access without erasing stored characters', async () => {
    const revoked = structuredClone(registry); revoked.credentials[0].revoked = true;
    await mf.setOptions({ ...config, durableObjectsPersist: directory,
      bindings: { PAIRING_REGISTRY: JSON.stringify(revoked) } });
    assert.equal((await call(mf, '/v1/characters')).status, 401);
    assert.equal((await call(mf, '/v1/characters', { token: tokenB })).status, 200);
    await mf.setOptions({ ...config, durableObjectsPersist: directory });
    assert.equal((await call(mf, '/v1/characters')).body.characters.length, 4);
  });
  await t.test('expired/malformed/ambiguous registry fails closed', async () => {
    const expired = structuredClone(registry); expired.credentials[0].expiresAt = now - 1;
    await mf.setOptions({ ...config, durableObjectsPersist: directory,
      bindings: { PAIRING_REGISTRY: JSON.stringify(expired) } });
    assert.equal((await call(mf, '/v1/characters')).status, 401);
    const duplicate = structuredClone(registry); duplicate.credentials.push(duplicate.credentials[0]);
    await mf.setOptions({ ...config, durableObjectsPersist: directory,
      bindings: { PAIRING_REGISTRY: JSON.stringify(duplicate) } });
    assert.deepEqual((await call(mf, '/v1/characters')).body, { error: 'configuration_unavailable' });
    await mf.setOptions({ ...config, durableObjectsPersist: directory,
      bindings: { PAIRING_REGISTRY: 'x'.repeat(4097) } });
    assert.equal((await call(mf, '/v1/characters')).status, 503);
  });
});
test('Cloudflare runtime: independently configured deployments do not share storage', async t => {
  const first = new Miniflare(config); const second = new Miniflare(config);
  t.after(async () => { await first.dispose(); await second.dispose(); });
  assert.equal((await call(first, '/v1/sync', { method: 'POST', body: snapshot() })).status, 201);
  assert.equal((await call(first, '/v1/characters')).body.characters.length, 1);
  assert.equal((await call(second, '/v1/characters')).body.characters.length, 0);
});
