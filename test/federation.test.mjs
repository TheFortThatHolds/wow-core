import test from 'node:test';
import assert from 'node:assert/strict';
import { characterKey, createGrant, revokeGrant, projectCharacter, assertGrant,
  assertCharacter, ContractError } from '../src/federation.mjs';

const now = 10000;
const character = { coreId: 'core-example-a', game: 'classic-test',
  realm: 'Example Realm', guid: 'Player-Example-A' };
const principal = { kind: 'owner', coreId: character.coreId };
const peer = { kind: 'guild', coreId: 'guild-example-a' };
function grant(sections = ['identity', 'progression']) {
  return createGrant({ principal, ownerCoreId: character.coreId, now,
    input: { id: 'grant-example', guildCoreId: peer.coreId,
      character, sections, expiresAt: now + 1000 } });
}
function record() {
  return { character, revision: 'revision-1', observedAt: now - 1,
    privateNotes: 'SYNTHETIC-PRIVATE', sections: {
      identity: { name: 'Example Hero', class: 'Mage', faction: 'Alliance',
        privateNotes: 'SYNTHETIC-PRIVATE' },
      progression: { level: 12, zone: 'Example Zone', money: 999 },
      bags: ['SYNTHETIC-PRIVATE'], notes: 'SYNTHETIC-PRIVATE',
      professions: [{ name: 'Alchemy', skill: 30, maxSkill: 75, privateNotes: 'SYNTHETIC-PRIVATE' }],
      gear: [{ slot: 'head', itemId: 1, itemLevel: 10, enchantNotes: 'SYNTHETIC-PRIVATE' }],
      availability: { role: 'damage', available: true, calendar: 'SYNTHETIC-PRIVATE' },
    } };
}
const denied = (fn, code) => assert.throws(fn, error => error instanceof ContractError
  && (!code || error.code === code));
function project(options = {}) {
  return projectCharacter({ principal: peer, record: record(), grant: grant(), now, ...options });
}

test('sharing requires the exact owner, never an officer or another Core', () => {
  for (const invalid of [undefined, peer, { kind: 'owner', coreId: 'core-example-b' }]) {
    denied(() => createGrant({ principal: invalid, ownerCoreId: character.coreId,
      input: {}, now }), 'owner_required');
  }
});
test('owner cannot grant a character belonging to another Core', () => {
  const input = { ...grant(), character: { ...character, coreId: 'core-example-b' } };
  denied(() => assertGrant(input));
});
test('keys isolate owner, game, realm and GUID even when display names match', () => {
  for (const key of Object.keys(character)) {
    assert.notEqual(characterKey(character), characterKey({ ...character, [key]: 'other' }));
  }
  assert.notEqual(characterKey({ ...character, realm: 'a:b' }),
    characterKey({ ...character, realm: 'a', guid: 'b:Player-Example-A' }));
});
test('sharing exports explicit fields only, never private content or unknown fields', () => {
  const result = project();
  assert.deepEqual(result.sections, {
    identity: { name: 'Example Hero', class: 'Mage', faction: 'Alliance' },
    progression: { level: 12, zone: 'Example Zone' },
  });
  assert.equal(JSON.stringify(result).includes('SYNTHETIC-PRIVATE'), false);
  assert.equal(result.revision, 'revision-1');
  assert.equal(result.observedAt, now - 1);
});
test('every approved scope filters nested private fields', () => {
  const result = project({ grant: grant(['identity', 'progression', 'professions', 'gear', 'availability']) });
  assert.equal(JSON.stringify(result).includes('SYNTHETIC-PRIVATE'), false);
  assert.deepEqual(result.sections.professions, [{ name: 'Alchemy', skill: 30, maxSkill: 75 }]);
});
test('private, wildcard, unknown, duplicated and empty grants fail closed', () => {
  for (const sections of [[], ['*'], ['notes'], ['bags'], ['identity', 'identity'], ['IDENTITY']]) {
    denied(() => grant(sections));
  }
});
test('unsupported grant versions and extra privilege fields fail', () => {
  denied(() => project({ grant: { ...grant(), version: 2 } }));
  denied(() => project({ grant: { ...grant(), role: 'owner' } }));
});
test('wrong, absent and player peer identities cannot read a guild projection', () => {
  for (const invalid of [undefined, principal, { ...peer, coreId: 'guild-example-b' }]) {
    denied(() => project({ principal: invalid }), 'wrong_audience');
  }
});
test('revocation denies new reads and is idempotent without changing ownership', () => {
  const revoked = revokeGrant({ principal, grant: grant(), now });
  denied(() => project({ grant: revoked }), 'grant_inactive');
  assert.deepEqual(revokeGrant({ principal, grant: revoked, now: now + 1 }), revoked);
  assert.deepEqual(revoked.character, character);
});
test('only source owner may revoke', () => {
  denied(() => revokeGrant({ principal: peer, grant: grant(), now }), 'owner_required');
});
test('expiry and not-yet-issued grants deny, including exact expiry', () => {
  denied(() => project({ now: now + 1000 }), 'grant_inactive');
  denied(() => project({ now: now - 1 }), 'grant_inactive');
});
test('scope cannot jump owner, game, realm or GUID at read time', () => {
  for (const key of Object.keys(character)) {
    denied(() => project({ record: { ...record(), character: { ...character, [key]: 'other' } } }),
      'wrong_character');
  }
});
test('projection detaches data and leaves the canonical record and grant unchanged', () => {
  const source = record(); const permission = grant();
  const before = structuredClone(source);
  const result = project({ record: source, grant: permission });
  result.character.realm = 'Changed'; result.sections.identity.name = 'Changed';
  assert.deepEqual(source, before); assert.deepEqual(permission.character, character);
});
test('missing observations are omitted, never fabricated', () => {
  assert.deepEqual(project({ record: { ...record(), sections: {} } }).sections, {});
});
test('malformed values, overlong text, future dates and oversized lists deny', () => {
  for (const value of [NaN, Infinity, -1, '12', 1.2]) {
    denied(() => project({ record: { ...record(), sections: { progression: { level: value } } } }));
  }
  denied(() => project({ record: { ...record(), observedAt: now + 1 } }), 'future_observation');
  denied(() => project({ record: { ...record(), sections: { identity: { name: 'x'.repeat(101) } } } }));
  denied(() => project({ grant: grant(['gear']), record: { ...record(), sections: { gear: Array(33).fill({}) } } }));
});
test('non-JSON objects and extra character fields fail', () => {
  denied(() => assertCharacter({ ...character, displayName: 'Example Hero' }));
  denied(() => assertCharacter(Object.create(character)));
  denied(() => project({ record: { ...record(), sections: new Map() } }));
});
