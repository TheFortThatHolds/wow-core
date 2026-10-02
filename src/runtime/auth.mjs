import { assertId, assertObject, assertTime } from '../federation.mjs';
import { digest, HttpError } from './input.mjs';

// Bootstrap machine pairing only. This is not human login, Blizzard OAuth,
// guild/officer authentication, or a federation credential.
export async function authenticate(request, env, now) {
  const header = request.headers.get('Authorization') ?? '';
  if (!/^Bearer [A-Za-z0-9_-]{43}$/.test(header)) throw new HttpError(401, 'unauthorized');
  let registry;
  try {
    if (typeof env.PAIRING_REGISTRY !== 'string'
      || new TextEncoder().encode(env.PAIRING_REGISTRY).byteLength > 4096) throw 0;
    registry = JSON.parse(env.PAIRING_REGISTRY);
    assertObject(registry, ['version', 'credentials']);
    if (registry.version !== 1 || !Array.isArray(registry.credentials)
      || registry.credentials.length > 16) throw 0;
    const hashes = new Set();
    for (const entry of registry.credentials) {
      assertObject(entry, ['sha256', 'coreId', 'expiresAt', 'revoked']);
      assertId(entry.coreId); assertTime(entry.expiresAt);
      if (typeof entry.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256) || typeof entry.revoked !== 'boolean'
        || hashes.has(entry.sha256)) throw 0;
      hashes.add(entry.sha256);
    }
  } catch { throw new HttpError(503, 'configuration_unavailable'); }
  const hash = await digest(header.slice(7));
  const credential = registry.credentials.find(entry => entry.sha256 === hash);
  if (!credential || credential.revoked || credential.expiresAt <= now)
    throw new HttpError(401, 'unauthorized');
  return { kind: 'owner', coreId: credential.coreId };
}
