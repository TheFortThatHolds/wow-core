import { assertCharacter, assertId, ContractError } from '../federation.mjs';
import { authenticate } from './auth.mjs';
import { canonicalJSON, digest, fail, HttpError, MAX_PAGE, readJSON,
  validateNotes, validateSnapshot } from './input.mjs';

export function json(value, status = 200) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } });
}
function parameters(url, allowed) {
  const keys = [...url.searchParams.keys()];
  fail(keys.every(key => allowed.includes(key)) && new Set(keys).size === keys.length,
    400, 'invalid_query');
}
function selector(url, coreId) {
  parameters(url, ['game', 'realm', 'guid']);
  const character = { coreId, game: url.searchParams.get('game'),
    realm: url.searchParams.get('realm'), guid: url.searchParams.get('guid') };
  assertCharacter(character); return character;
}
function rosterQuery(url) {
  parameters(url, ['after', 'limit', 'game', 'faction']);
  const after = url.searchParams.get('after') ?? '';
  fail(after.length <= 600, 400, 'invalid_cursor');
  const rawLimit = url.searchParams.get('limit') ?? '25';
  fail(/^\d{1,2}$/.test(rawLimit), 400, 'invalid_limit');
  const limit = Number(rawLimit);
  fail(limit >= 1 && limit <= MAX_PAGE, 400, 'invalid_limit');
  const game = url.searchParams.get('game'); if (game !== null) assertId(game);
  const faction = url.searchParams.get('faction');
  fail(faction === null || ['Horde', 'Alliance', 'Neutral'].includes(faction), 400, 'invalid_faction');
  return { after, limit, game, faction };
}
export async function handleRequest(request, env) {
  try {
    const url = new URL(request.url);
    fail(url.protocol === 'https:', 400, 'https_required');
    // Machine-only API for now: browser cookies/CORS login are a later stage.
    fail(!request.headers.has('Origin'), 403, 'browser_access_unavailable');
    if (request.method === 'GET' && url.pathname === '/health') {
      parameters(url, []); return json({ service: 'wow-core', version: 1 });
    }
    const now = Math.floor(Date.now() / 1000);
    const principal = await authenticate(request, env, now);
    fail(env.PLAYER_CORES !== undefined, 503, 'configuration_unavailable');
    let action; let input;
    if (request.method === 'POST' && url.pathname === '/v1/sync') {
      parameters(url, []);
      const snapshot = validateSnapshot(await readJSON(request), principal.coreId, now);
      input = [snapshot, await digest(canonicalJSON(snapshot)), now]; action = 'sync';
    } else if (request.method === 'GET' && url.pathname === '/v1/characters') {
      input = [rosterQuery(url)]; action = 'roster';
    } else if (request.method === 'GET' && url.pathname === '/v1/character') {
      input = [selector(url, principal.coreId)]; action = 'read';
    } else if (request.method === 'PUT' && url.pathname === '/v1/character/notes') {
      const character = selector(url, principal.coreId);
      input = [character, validateNotes(await readJSON(request)), now]; action = 'notes';
    } else throw new HttpError(404, 'not_found');
    // Exactly one object invocation, chosen ONLY from the server-side mapping.
    const id = env.PLAYER_CORES.idFromName('player:' + principal.coreId);
    const response = await env.PLAYER_CORES.get(id)[action](principal.coreId, ...input);
    if (!response.ok) throw new HttpError(response.status, response.code);
    const result = response.value;
    return json(result, action === 'sync' && result.created ? 201 : 200);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.code }, error.status);
    if (error instanceof ContractError) return json({ error: 'invalid_contract' }, 400);
    // RPC exceptions/SQL diagnostics can contain records; never return or log them.
    return json({ error: 'service_unavailable' }, 503);
  }
}
