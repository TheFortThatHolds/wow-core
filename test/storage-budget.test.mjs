import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { PlayerStore } from '../src/runtime/store.mjs';
import { handleRequest } from '../src/runtime/http.mjs';
import { canonicalJSON, digest } from '../src/runtime/input.mjs';

function storage() {
  const database = new DatabaseSync(':memory:');
  const calls = [];
  return { database, calls, transactionSync(operation) {
    database.exec('BEGIN');
    try { const value = operation(); database.exec('COMMIT'); return value; }
    catch (error) { database.exec('ROLLBACK'); throw error; }
  }, sql: { exec(query, ...values) {
    calls.push({ query, values });
    if (values.length === 0 && /CREATE TABLE/.test(query)) { database.exec(query); return {}; }
    const statement = database.prepare(query);
    if (/^\s*(SELECT|EXPLAIN)/.test(query)) {
      const rows = statement.all(...values);
      return { toArray: () => rows, one: () => { assert.equal(rows.length, 1); return rows[0]; } };
    }
    statement.run(...values); return {};
  } } };
}
function snapshot(index = 1) {
  return { version: 1, character: { coreId: 'synthetic-owner', game: index % 2 ? 'test-beta' : 'test-release',
    realm: 'us:Example Realm', guid: 'Example-' + index }, observedAt: 100,
  source: { kind: 'addon', version: 'v1' }, sections: { identity: { name: 'Example ' + index,
    faction: index % 3 ? 'Horde' : 'Alliance' }, progression: { level: 5 } } };
}
test('SQLite scale: indexed pages, exact reads and fixed statement budgets at 500 characters', async t => {
  const backing = storage(); t.after(() => backing.database.close());
  const store = new PlayerStore(backing);
  for (let index = 1; index <= 500; index++) store.sync(snapshot(index), 'synthetic-hash', 101 + index);
  backing.calls.length = 0;
  const page = store.roster({ after: '', limit: 25, game: 'test-beta', faction: 'Horde' });
  assert.equal(page.characters.length, 25); assert.equal(backing.calls.length, 1);
  const { query, values } = backing.calls[0];
  assert.ok(!query.includes('body'));
  const plan = backing.database.prepare('EXPLAIN QUERY PLAN ' + query).all(...values);
  assert.ok(plan.some(row => /COVERING INDEX roster_game_faction/.test(row.detail)));
  assert.ok(!plan.some(row => /SCAN|TEMP B-TREE/.test(row.detail)));
  for (const filter of [{}, { game: 'test-beta' }, { faction: 'Alliance' }]) {
    store.roster({ after: '', limit: 25, ...filter });
    const last = backing.calls.at(-1);
    const filterPlan = backing.database.prepare('EXPLAIN QUERY PLAN ' + last.query).all(...last.values);
    assert.ok(filterPlan.some(row => /COVERING INDEX/.test(row.detail)));
    assert.ok(!filterPlan.some(row => /SCAN|TEMP B-TREE/.test(row.detail)));
  }
  backing.calls.length = 0;
  assert.equal(store.get(snapshot(250).character).revision, 1);
  assert.equal(backing.calls.length, 1);
  backing.calls.length = 0;
  store.sync({ ...snapshot(250), observedAt: 102 }, 'new-hash', 1000);
  assert.equal(backing.calls.length, 4);
  backing.calls.length = 0;
  assert.throws(() => store.sync(snapshot(501), 'new-hash', 103), error => error.status === 429);
  assert.equal(backing.calls.length, 2);
  assert.equal(backing.database.prepare('SELECT character_count FROM metadata').get().character_count, 500);
});
test('SQLite: durable per-owner write caps, reset, restart, rollback and read availability', t => {
  const backing = storage(); t.after(() => backing.database.close());
  let store = new PlayerStore(backing);
  for (let index = 0; index < 120; index++) store.sync({ ...snapshot(), observedAt: index + 1 },
    'hash-' + index, 1000);
  const latest = store.get(snapshot().character);
  assert.throws(() => store.notes(snapshot().character, { expectedRevision: latest.revision,
    notes: ['Invented'] }, 1000), error => error.code === 'write_limit');
  assert.equal(store.get(snapshot().character).revision, latest.revision);
  store = new PlayerStore(backing); // persistent quota, not process memory
  assert.throws(() => store.sync({ ...snapshot(), observedAt: 121 }, 'new', 1000),
    error => error.code === 'write_limit');
  assert.equal(store.sync({ ...snapshot(), observedAt: 120 }, 'hash-119', 1000).unchanged, true);
  assert.equal(store.roster({ after: '', limit: 25 }).characters.length, 1);
  assert.equal(store.sync({ ...snapshot(), observedAt: 121 }, 'new', 1060).record.revision, 121);
  backing.database.exec('UPDATE metadata SET day_mutations = 2000');
  assert.throws(() => store.sync({ ...snapshot(), observedAt: 122 }, 'newer', 1120),
    error => error.code === 'write_limit');
  assert.equal(store.sync({ ...snapshot(), observedAt: 122 }, 'newer', 86400).record.revision, 122);
});
test('SQLite: failed multi-write transaction rolls back count and record together', t => {
  const backing = storage(); t.after(() => backing.database.close());
  const store = new PlayerStore(backing);
  const original = store.write.bind(store);
  store.write = record => { original(record); throw new Error('synthetic disk failure'); };
  assert.throws(() => store.sync(snapshot(), 'hash', 101));
  assert.equal(store.get(snapshot().character), null);
  assert.equal(backing.database.prepare('SELECT character_count FROM metadata').get().character_count, 0);
});
test('HTTP routing: no storage call for denied input; one exact mapped object call for accepted sync', async () => {
  const token = 'A'.repeat(43); // Invented test-only credential, never a provisioning example.
  const calls = [];
  const env = { PAIRING_REGISTRY: JSON.stringify({ version: 1, credentials: [
    { sha256: await digest(token), coreId: 'synthetic-owner', expiresAt: 9999999999, revoked: false },
  ] }), PLAYER_CORES: {
    idFromName: name => { calls.push(['id', name]); return name; },
    get: id => { calls.push(['get', id]); return { sync: async (...args) => {
      calls.push(['sync', ...args]); return { ok: true, value: { created: true } };
    } }; },
  } };
  function request(body) { return new Request('https://core.example/v1/sync', { method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body) }); }
  const invalid = snapshot(); invalid.character.coreId = 'other-owner';
  assert.equal((await handleRequest(request(invalid), env)).status, 403);
  assert.deepEqual(calls, []);
  assert.equal((await handleRequest(request(snapshot()), env)).status, 201);
  assert.equal(calls.filter(call => call[0] === 'sync').length, 1);
  assert.equal(calls[0][1], 'player:synthetic-owner');
  assert.equal(calls[2][1], 'synthetic-owner');
  assert.equal(calls[2][3], await digest(canonicalJSON(snapshot())));
});
