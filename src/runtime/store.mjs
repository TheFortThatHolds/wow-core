import { characterKey } from '../federation.mjs';
import { baselineModules, fail, MAX_CHARACTERS, MAX_MUTATIONS_PER_DAY,
  MAX_MUTATIONS_PER_MINUTE } from './input.mjs';

// Only exact character bodies are read. Roster pages use summary columns and
// covering indexes; they never fetch every character body and filter afterward.
export class PlayerStore {
  constructor(storage) {
    this.storage = storage;
    this.sql = storage.sql;
    storage.transactionSync(() => {
      this.sql.exec(`CREATE TABLE IF NOT EXISTS metadata (
        singleton INTEGER PRIMARY KEY CHECK(singleton = 1),
        version INTEGER NOT NULL, character_count INTEGER NOT NULL,
        minute_bucket INTEGER NOT NULL, minute_mutations INTEGER NOT NULL,
        day_bucket INTEGER NOT NULL, day_mutations INTEGER NOT NULL);
        INSERT OR IGNORE INTO metadata VALUES(1, 1, 0, 0, 0, 0, 0);
        CREATE TABLE IF NOT EXISTS characters (
          key TEXT PRIMARY KEY, game TEXT NOT NULL, faction TEXT NOT NULL,
          body TEXT NOT NULL, summary TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS roster_all ON characters(key, summary);
        CREATE INDEX IF NOT EXISTS roster_game ON characters(game, key, summary);
        CREATE INDEX IF NOT EXISTS roster_faction ON characters(faction, key, summary);
        CREATE INDEX IF NOT EXISTS roster_game_faction ON characters(game, faction, key, summary);`);
      fail(this.sql.exec('SELECT version FROM metadata WHERE singleton = 1').one().version === 1,
        503, 'storage_version_unavailable');
    });
  }
  get(character) {
    const row = this.sql.exec('SELECT body FROM characters WHERE key = ?', characterKey(character))
      .toArray()[0];
    return row ? JSON.parse(row.body) : null;
  }
  write(record) {
    const summary = { character: record.character, revision: record.revision,
      observedAt: record.observedAt, identity: record.sections.identity,
      ...(record.sections.progression ? { progression: record.sections.progression } : {}) };
    this.sql.exec(`INSERT INTO characters(key, game, faction, body, summary) VALUES(?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET body=excluded.body, summary=excluded.summary,
      faction=excluded.faction`, characterKey(record.character), record.character.game,
    record.sections.identity.faction ?? '', JSON.stringify(record), JSON.stringify(summary));
  }
  reserveMutation(now, creating = false) {
    const metadata = this.sql.exec('SELECT * FROM metadata WHERE singleton = 1').one();
    if (creating) fail(metadata.character_count < MAX_CHARACTERS, 429, 'character_limit');
    const minute = Math.floor(now / 60); const day = Math.floor(now / 86400);
    const minuteCount = metadata.minute_bucket === minute ? metadata.minute_mutations : 0;
    const dayCount = metadata.day_bucket === day ? metadata.day_mutations : 0;
    fail(minuteCount < MAX_MUTATIONS_PER_MINUTE && dayCount < MAX_MUTATIONS_PER_DAY,
      429, 'write_limit');
    this.sql.exec(`UPDATE metadata SET character_count = character_count + ?,
      minute_bucket = ?, minute_mutations = ?, day_bucket = ?, day_mutations = ?
      WHERE singleton = 1`, creating ? 1 : 0, minute, minuteCount + 1, day, dayCount + 1);
  }
  sync(snapshot, hash, now) {
    return this.storage.transactionSync(() => {
      const previous = this.get(snapshot.character);
      if (previous) {
        fail(snapshot.observedAt >= previous.observedAt, 409, 'stale_snapshot');
        if (snapshot.observedAt === previous.observedAt) {
          fail(hash === previous.snapshotHash, 409, 'snapshot_conflict');
          return { created: false, unchanged: true, record: previous };
        }
      }
      this.reserveMutation(now, !previous);
      const sectionObservedAt = { ...(previous?.sectionObservedAt ?? {}) };
      for (const name of Object.keys(snapshot.sections)) sectionObservedAt[name] = snapshot.observedAt;
      const record = { version: 1, character: snapshot.character,
        revision: (previous?.revision ?? 0) + 1, observedAt: snapshot.observedAt,
        receivedAt: now, source: snapshot.source, snapshotHash: hash,
        sections: { ...(previous?.sections ?? {}), ...snapshot.sections }, sectionObservedAt,
        modules: previous?.modules ?? baselineModules() };
      this.write(record);
      return { created: !previous, unchanged: false, record };
    });
  }
  notes(character, input, now) {
    return this.storage.transactionSync(() => {
      const record = this.get(character);
      fail(record !== null, 404, 'not_found');
      fail(record.revision === input.expectedRevision, 409, 'revision_conflict');
      this.reserveMutation(now);
      record.modules.notes = input.notes; record.revision += 1;
      this.write(record); return record;
    });
  }
  roster({ after, limit, game, faction }) {
    const clauses = ['key > ?']; const values = [after];
    if (game) { clauses.push('game = ?'); values.push(game); }
    if (faction) { clauses.push('faction = ?'); values.push(faction); }
    const cursor = this.sql.exec(`SELECT key, summary FROM characters
      WHERE ${clauses.join(' AND ')} ORDER BY key LIMIT ?`, ...values, limit + 1);
    const rows = cursor.toArray();
    return { characters: rows.slice(0, limit).map(row => JSON.parse(row.summary)),
      nextCursor: rows.length > limit ? rows[limit - 1].key : null };
  }
}
