import { DurableObject } from 'cloudflare:workers';
import { assertCharacter, assertId } from '../federation.mjs';
import { handleRequest } from './http.mjs';
import { fail, validateNotes, validateSnapshot } from './input.mjs';
import { PlayerStore } from './store.mjs';

export class PlayerCore extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.store = new PlayerStore(ctx.storage);
  }
  authorize(coreId, character) {
    assertId(coreId);
    fail(this.ctx.id.toString() === this.env.PLAYER_CORES.idFromName('player:' + coreId).toString(),
      403, 'wrong_owner');
    if (character) { assertCharacter(character); fail(character.coreId === coreId, 403, 'wrong_owner'); }
  }
  // Return tagged failures explicitly: custom Error identity/properties are not
  // guaranteed to survive Cloudflare RPC serialization.
  result(operation) {
    try { return { ok: true, value: operation() }; }
    catch (error) {
      if (error.status) return { ok: false, status: error.status, code: error.code };
      return { ok: false, status: 503, code: 'service_unavailable' };
    }
  }
  sync(coreId, snapshot, hash, now) {
    return this.result(() => {
      this.authorize(coreId, snapshot.character);
      validateSnapshot(snapshot, coreId, now);
      return this.store.sync(snapshot, hash, now);
    });
  }
  read(coreId, character) {
    return this.result(() => {
      this.authorize(coreId, character);
      const record = this.store.get(character); fail(record !== null, 404, 'not_found');
      return { record };
    });
  }
  roster(coreId, query) {
    return this.result(() => { this.authorize(coreId); return this.store.roster(query); });
  }
  notes(coreId, character, input, now) {
    return this.result(() => {
      this.authorize(coreId, character); validateNotes(input);
      return { record: this.store.notes(character, input, now) };
    });
  }
}
export default { fetch: handleRequest };
