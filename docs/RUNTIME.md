# Player runtime foundation — milestone 1, first slice

This is original generic implementation, not extracted personal deployment code.
The Worker authenticates a machine pairing credential and maps it to one logical
owner Core; a SQLite Durable Object per Core persists canonical character state.
It is tested locally, not deployed, and is not ready for member rollout.
The source-side federation contract remains unchanged and independently exported.

## Authentication and deployment boundary

`PAIRING_REGISTRY` is a backend secret, not checked-in configuration. Its version-1
shape is `{version: 1, credentials: [...]}`. Each entry contains `sha256` (lowercase
SHA-256 hex of the bearer token), `coreId`, `expiresAt` (Unix seconds), and `revoked`
(boolean). Tokens must be independently generated from 32 cryptographically random
bytes, encoded as unpadded base64url, and delivered/stored securely. Do not use
names, passwords, the invented tests' values, GitHub tokens or Cloudflare API keys.
Never publish either tokens or the registry; hashes and IDs are operator material.

This small bootstrap registry is limited to 16 credentials and 4096 UTF-8 bytes,
below the documented 5 KB binding limit. This is not scalable guild provisioning.
Missing, invalid, expired, revoked or ambiguous credentials fail closed. Owner
identity comes only from that server mapping. Payloads, headers and query filters
cannot select a different owner. Distinct keys can map to one owner for rotation;
removing/revoking the old key blocks future requests after the updated secret's
deployment takes effect. There is no identity rename/migration or login UI yet.

No cookies, browser Origin requests, CORS, human OAuth, guild roles or peer
credentials are accepted here. A paired client can write its owner's observations
and notes; this does not prove Battle.net account or character ownership. Addon
facts are attributed owner-submitted observations, not Blizzard-authenticated facts.
The Durable Object binding is privileged infrastructure and must not be shared
with untrusted Workers. HTTP users cannot directly choose or invoke objects.
An infrastructure operator can still inspect hosted data.

`wrangler.jsonc` declares SQLite storage and migration version 1, with no account
IDs, domains, secrets, public workers.dev endpoint or preview URL. Observability
is off; routes return fixed safe errors and no private health information. These
defaults reduce accidental exposure, but are not an entire abuse/security policy.

## Version-1 personal transport

All routes require HTTPS. Authentication is `Authorization: Bearer <token>`;
credentials in URLs or cookies are never supported.

| Route | Behavior |
| --- | --- |
| `GET /health` | Public static service/version only; not dependency health |
| `POST /v1/sync` | Validate snapshot, create or update the canonical character |
| `GET /v1/characters` | Private bounded summary page; game/faction filters |
| `GET /v1/character` | Private exact character read |
| `PUT /v1/character/notes` | Private note replacement with revision precondition |

The snapshot has exactly `version: 1`, `character`, `observedAt`, `source`, and
`sections`. `character` is `{coreId, game, realm, guid}`; realm is region-qualified
(for example, the invented `us:Example Realm`). `source` is `{kind: 'addon', version}`.
`observedAt` is Unix seconds, never later than the receiving server's clock.
`sections.identity.name` is required. Supported sections are identity (name,
secondName, class, race, faction), progression (level, itemLevel, zone), professions
(name, skill, maxSkill) and gear (slot, itemId, itemLevel). Fields/lists are bounded.
Unknown fields fail rather than silently claim collection support. This is NOT
the installed addon's legacy schema or complete allowed game-data coverage.
Collector conversion and further reviewed collection schemas remain milestone 5.

Exact reads and note writes require `game`, `realm`, `guid` query parameters.
Owner is taken from authentication, never a query. Notes input is
`{expectedRevision, notes}`; notes are bounded text entries. The precondition
prevents simultaneous writes from losing state. Stale revision is HTTP 409.

Roster accepts only `game`, `faction`, `limit` (1–50, default 25), and `after`.
Use the returned `nextCursor` unchanged for the next page with the same filters.
Summaries have character identity, revision, observation time, identity and
progression—not private notes or every record body. No fuzzy/name search yet.
Beta and release can both appear unless filtered; archival/default view is later.

## Atomic merging, preservation and limits

- Exact owner/game/realm/GUID tuple is the canonical key; display names never merge.
- New characters get independent version-1 identity/macros/macroBuilder/travel/notes
  modules with empty state. There is no cloned character or competing roster.
- Newer observed sections replace only those sections. Missing sections retain
  their previous data and separate `sectionObservedAt` timestamp: retained is not
  silently relabeled current. Future UI/federation must use that section freshness.
- Private modules/notes survive sync. This API currently edits notes only.
- Same-time identical snapshots are idempotent, even if JSON property order differs.
  Older snapshots or changed same-time content return HTTP 409. A future exporter
  must ensure newly changed snapshots have a later observation timestamp.
- Character update/count changes use a synchronous transaction, including rollback.
  The versioned storage layout fails closed on unsupported metadata versions.
- JSON uploads are limited to 64 KiB, including streamed uploads without a size
  header. Unsupported compression/content types fail. Maximum 500 characters/Core.
- Actual mutations share a persistent per-Core cap of 120/minute and 2000/UTC day.
  Quota and record changes commit/roll back together; caps survive restart. HTTP
  429 leaves state intact; reads and unchanged snapshot retries still work. These
  are initial development limits, not an agreed guild billing allowance. Read
  traffic/failed attempts are not capped by this mechanism; edge limits are needed.
- No model calls, embeddings, external API calls, paid loops or scheduled jobs.
  This describes THIS new runtime, not other systems' existing indexing behavior.

Warm-path budgets: one object invocation per authenticated successful request;
roster/exact character read uses one SQL statement, unchanged/stale sync one,
existing-character update/note write four, initial onboarding four. Initial object
schema setup adds fixed initialization statements. Covering indexes bound all
roster filter combinations, limit at most 51 summary rows and avoid body scans.
SQL statement counts are NOT billable-row counts: index writes have costs too.
Mutation caps do not bound total read/failed-request volume or overall spending.

## Verification and next gates

Run `npm ci --ignore-scripts`, `npm run check`, `npm test`, `npm audit`, and
`npm pack --dry-run` with Node.js 24 (22.13+ also supports the SQLite test API).
Tests use only synthetic owners/game records and generated throwaway credentials.
Miniflare runs the actual Worker/SQLite Durable Object with persistence across
runtime restart, concurrent arrival, owner isolation, notes, expiry and revocation.
Separate SQLite instrumentation checks indexed query plans and statement budgets
at 500 characters; that is not a production billing or load test.

The local test tools pin stable Miniflare 4; sharp/undici overrides patch reported
development vulnerabilities and are regression-tested. They are not runtime
dependencies and no installation scripts or production credentials run in CI.

Still required before deployment/member rollout: authenticated secure provisioning
and recovery; edge/per-owner abuse and volume limits; quota/billing evidence;
host disclosure/export/migration/retention; human sessions/Blizzard OAuth; reviewed
full snapshot collectors; canonical sheet UI; signed federation; real install/game
and voice tests. Do not turn this bootstrap registry into a public signup system.

Official sources reviewed 2026-10-02: [SQLite storage and transactions](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/),
[storage guidance](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/),
[secrets](https://developers.cloudflare.com/workers/configuration/secrets/),
[platform limits](https://developers.cloudflare.com/workers/platform/limits/), and
[local module testing](https://developers.cloudflare.com/workers/testing/miniflare/core/modules/).
