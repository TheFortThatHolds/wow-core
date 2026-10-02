import { assertCharacter, assertId, assertObject, assertTime, requireContract } from '../federation.mjs';

export const MAX_BODY_BYTES = 65536;
export const MAX_CHARACTERS = 500;
export const MAX_PAGE = 50;
export const TEMPLATE_VERSION = 1;
export const MAX_MUTATIONS_PER_MINUTE = 120;
export const MAX_MUTATIONS_PER_DAY = 2000;

export class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
export function fail(condition, status, code) {
  if (!condition) throw new HttpError(status, code);
}
function text(value, max = 100) {
  requireContract(typeof value === 'string' && value.length > 0 && value.length <= max
    && value === value.trim() && !/[\u0000-\u001f\u007f]/.test(value));
  return value;
}
function number(value, max = 100000, integer = true) {
  requireContract(typeof value === 'number' && Number.isFinite(value) && value >= 0
    && value <= max && (!integer || Number.isSafeInteger(value)));
  return value;
}
function fields(value, validators) {
  assertObject(value, Object.keys(validators));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, validators[key](item)]));
}
function list(value, max, validators) {
  requireContract(Array.isArray(value) && value.length <= max);
  return value.map(item => fields(item, validators));
}
const validators = {
  identity: value => fields(value, { name: text, secondName: text, class: text,
    race: text, faction: value => {
      requireContract(['Horde', 'Alliance', 'Neutral'].includes(value)); return value;
    } }),
  progression: value => fields(value, { level: value => number(value, 1000),
    itemLevel: value => number(value, 100000, false), zone: text }),
  professions: value => list(value, 8, { name: text,
    skill: number, maxSkill: number }),
  gear: value => list(value, 32, { slot: text, itemId: value => number(value, 10000000),
    itemLevel: value => number(value, 100000, false) }),
};
// This first transport contract is deliberately small; unsupported collections
// must get reviewed schemas before a collector can send them. No arbitrary blobs.
export function validateSnapshot(value, coreId, now) {
  assertObject(value, ['version', 'character', 'observedAt', 'source', 'sections']);
  requireContract(value.version === 1);
  assertCharacter(value.character);
  requireContract(/^[a-z]{2}:.+/.test(value.character.realm));
  fail(value.character.coreId === coreId, 403, 'wrong_owner');
  assertTime(value.observedAt);
  fail(value.observedAt <= now, 400, 'future_observation');
  assertObject(value.source, ['kind', 'version']);
  requireContract(value.source.kind === 'addon'); assertId(value.source.version);
  assertObject(value.sections, Object.keys(validators));
  requireContract(Object.hasOwn(value.sections, 'identity'));
  const sections = Object.fromEntries(Object.entries(value.sections)
    .map(([key, item]) => [key, validators[key](item)]));
  requireContract(typeof sections.identity.name === 'string');
  return { version: 1, character: structuredClone(value.character),
    observedAt: value.observedAt, source: structuredClone(value.source), sections };
}
export function baselineModules() {
  return { version: TEMPLATE_VERSION, identity: {}, macros: [], macroBuilder: {},
    travel: {}, notes: [] };
}
export function validateNotes(value) {
  assertObject(value, ['expectedRevision', 'notes']);
  requireContract(Number.isSafeInteger(value.expectedRevision) && value.expectedRevision > 0);
  requireContract(Array.isArray(value.notes) && value.notes.length <= 100);
  const notes = value.notes.map(note => text(note, 2000));
  return { expectedRevision: value.expectedRevision, notes };
}
export function canonicalJSON(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJSON).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.keys(value).sort()
    .map(key => JSON.stringify(key) + ':' + canonicalJSON(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
export async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function readJSON(request) {
  fail(/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('Content-Type') ?? ''),
    415, 'json_required');
  const declared = request.headers.get('Content-Length');
  if (declared !== null) fail(/^\d+$/.test(declared) && Number(declared) <= MAX_BODY_BYTES,
    413, 'payload_too_large');
  fail(!request.headers.has('Content-Encoding'), 415, 'encoding_not_supported');
  fail(request.body !== null, 400, 'invalid_body');
  const reader = request.body.getReader();
  const chunks = []; let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel(); throw new HttpError(413, 'payload_too_large');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new HttpError(400, 'invalid_json'); }
}
