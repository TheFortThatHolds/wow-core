// Pure policy kernel, not an authentication server. See docs/FEDERATION.md.
export const CONTRACT_VERSION = 1;
export const SHARE_SECTIONS = Object.freeze([
  'identity', 'progression', 'professions', 'gear', 'availability',
]);
export const MEMBER_ROLES = Object.freeze(['owner', 'officer', 'member']);

export class ContractError extends Error {
  constructor(code) { super(code); this.name = 'ContractError'; this.code = code; }
}
export function requireContract(condition, code = 'invalid_contract') {
  if (!condition) throw new ContractError(code);
}
export function assertObject(value, keys) {
  requireContract(value !== null && typeof value === 'object' && !Array.isArray(value));
  requireContract([Object.prototype, null].includes(Object.getPrototypeOf(value)));
  if (keys) requireContract(Object.keys(value).every(key => keys.includes(key)));
  return value;
}
export function assertId(value) {
  requireContract(typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value));
  return value;
}
export function assertTime(value) {
  requireContract(Number.isSafeInteger(value) && value >= 0);
  return value;
}
function text(value, limit = 100) {
  requireContract(typeof value === 'string' && value.length > 0 && value.length <= limit
    && value === value.trim() && !/[\u0000-\u001f\u007f]/.test(value));
  return value;
}
function number(value, max = 100000, integer = true) {
  requireContract(typeof value === 'number' && Number.isFinite(value) && value >= 0
    && value <= max && (!integer || Number.isSafeInteger(value)));
  return value;
}
export function assertCharacter(value) {
  assertObject(value, ['coreId', 'game', 'realm', 'guid']);
  assertId(value.coreId); assertId(value.game); text(value.realm); assertId(value.guid);
  return value;
}
export function characterKey(character) {
  assertCharacter(character);
  // Tuple encoding avoids separator collisions; names are never keys.
  return JSON.stringify([character.coreId, character.game, character.realm, character.guid]);
}
function owner(principal, ownerCoreId) {
  requireContract(principal?.kind === 'owner' && principal.coreId === ownerCoreId, 'owner_required');
}
export function assertGrant(value) {
  assertObject(value, ['version', 'id', 'ownerCoreId', 'guildCoreId', 'character',
    'sections', 'issuedAt', 'expiresAt', 'revokedAt']);
  requireContract(value.version === CONTRACT_VERSION);
  assertId(value.id); assertId(value.ownerCoreId); assertId(value.guildCoreId);
  assertCharacter(value.character);
  requireContract(value.character.coreId === value.ownerCoreId);
  requireContract(Array.isArray(value.sections) && value.sections.length > 0
    && value.sections.length <= SHARE_SECTIONS.length
    && value.sections.every(section => SHARE_SECTIONS.includes(section))
    && new Set(value.sections).size === value.sections.length);
  assertTime(value.issuedAt); assertTime(value.expiresAt);
  requireContract(value.expiresAt > value.issuedAt);
  if (value.revokedAt !== null) {
    assertTime(value.revokedAt); requireContract(value.revokedAt >= value.issuedAt);
  }
  return value;
}
export function createGrant({ principal, ownerCoreId, input, now }) {
  assertId(ownerCoreId); owner(principal, ownerCoreId); assertTime(now);
  assertObject(input, ['id', 'guildCoreId', 'character', 'sections', 'expiresAt']);
  const grant = { version: CONTRACT_VERSION, id: input.id, ownerCoreId,
    guildCoreId: input.guildCoreId, character: structuredClone(input.character),
    sections: structuredClone(input.sections), issuedAt: now,
    expiresAt: input.expiresAt, revokedAt: null };
  assertGrant(grant);
  return grant;
}
export function revokeGrant({ principal, grant, now }) {
  assertGrant(grant); owner(principal, grant.ownerCoreId); assertTime(now);
  requireContract(now >= grant.issuedAt);
  return { ...structuredClone(grant), revokedAt: grant.revokedAt ?? now };
}
function pick(value, fields) {
  assertObject(value);
  const result = {};
  for (const [key, validate] of Object.entries(fields)) {
    if (Object.hasOwn(value, key)) result[key] = validate(value[key]);
  }
  return result;
}
function entries(value, max, fields) {
  requireContract(Array.isArray(value) && value.length <= max);
  return value.map(entry => pick(entry, fields));
}
const projectors = Object.freeze({
  identity: value => pick(value, { name: text, class: text, race: text, faction: text }),
  progression: value => pick(value, { level: value => number(value, 1000),
    itemLevel: value => number(value, 100000, false), zone: text }),
  professions: value => entries(value, 8, { name: text,
    skill: value => number(value), maxSkill: value => number(value) }),
  gear: value => entries(value, 32, { slot: text, itemId: value => number(value),
    itemLevel: value => number(value, 100000, false) }),
  availability: value => pick(value, { role: text, available: value => {
    requireContract(typeof value === 'boolean'); return value;
  } }),
});
export function projectCharacter({ principal, record, grant, now }) {
  assertGrant(grant); assertTime(now);
  requireContract(principal?.kind === 'guild' && principal.coreId === grant.guildCoreId,
    'wrong_audience');
  requireContract(grant.revokedAt === null && now >= grant.issuedAt && now < grant.expiresAt,
    'grant_inactive');
  assertObject(record); assertCharacter(record.character);
  requireContract(characterKey(record.character) === characterKey(grant.character),
    'wrong_character');
  assertId(record.revision); assertTime(record.observedAt);
  requireContract(record.observedAt <= now, 'future_observation');
  assertObject(record.sections);
  const sections = {};
  for (const section of grant.sections) {
    if (Object.hasOwn(record.sections, section)) {
      sections[section] = projectors[section](record.sections[section]);
    }
  }
  // Construct output from an allowlist. Never spread a private record/section.
  return { version: CONTRACT_VERSION, grantId: grant.id,
    character: structuredClone(record.character), revision: record.revision,
    observedAt: record.observedAt, retrievedAt: now, expiresAt: grant.expiresAt, sections };
}
export function assertMembership(value) {
  assertObject(value, ['version', 'id', 'guildCoreId', 'playerCoreId', 'role',
    'state', 'approvedAt', 'leftAt']);
  requireContract(value.version === CONTRACT_VERSION);
  assertId(value.id); assertId(value.guildCoreId); assertId(value.playerCoreId);
  requireContract(MEMBER_ROLES.includes(value.role));
  requireContract(['active', 'left'].includes(value.state)); assertTime(value.approvedAt);
  if (value.state === 'active') requireContract(value.leftAt === null);
  else { assertTime(value.leftAt); requireContract(value.leftAt >= value.approvedAt); }
  return value;
}
export function assertInvitation(value) {
  assertObject(value, ['version', 'id', 'guildCoreId', 'playerCoreId', 'state',
    'issuedAt', 'expiresAt', 'acceptedAt']);
  requireContract(value.version === CONTRACT_VERSION);
  assertId(value.id); assertId(value.guildCoreId); assertId(value.playerCoreId);
  requireContract(['pending', 'accepted', 'approved', 'revoked'].includes(value.state));
  assertTime(value.issuedAt); assertTime(value.expiresAt);
  requireContract(value.expiresAt > value.issuedAt);
  if (value.acceptedAt !== null) {
    assertTime(value.acceptedAt);
    requireContract(value.acceptedAt >= value.issuedAt && value.acceptedAt < value.expiresAt);
  }
  if (value.state === 'pending') requireContract(value.acceptedAt === null);
  if (['accepted', 'approved'].includes(value.state)) requireContract(value.acceptedAt !== null);
  return value;
}
