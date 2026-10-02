# Hosting choices — design contract, not a deployed feature

The player tool and guild coordination tool must work with any configured guild,
region, realm and supported game channel. No fixed guild, operator, Discord
server or Blizzard namespace belongs in source configuration.

## Two optional modes, one character model

| Mode | Infrastructure owner | Member setup | Important boundary |
| --- | --- | --- | --- |
| Self-owned Core | Player | Configure own backend, sign in and pair | Player controls storage and billing |
| Guild-hosted member Core | Guild operator | Accept invite, sign in, consent and pair | Operator controls storage and billing |

The member uses the same addon, `/wowcore sync`, canonical character sheets and
one voice interface in either mode. Choosing hosted mode must not require a
Cloudflare account, a personal Blizzard developer client or infrastructure keys.
The operator supplies their application credentials; members authorize their own
Battle.net access if needed. Authorizing Blizzard is separate from consenting
to Core storage and guild sharing. A member can decline OAuth and still use
allowed addon sync; only OAuth-dependent enrichment is unavailable.

Each hosted member has a distinct stable logical Core ID. Guild coordination
has a separate Core ID and role boundary even when both services share a
Cloudflare account. A guild role never implicitly grants application access to
another member's private records. Personal records remain the canonical source;
the guild sees approved projections, not a parallel character database.

Hosting alone does not change permitted addon/API coverage. Sources, game
support, member consent and freshness determine completeness; see
[BLIZZARD_DATA.md](BLIZZARD_DATA.md). A sharing preset can be approved once and
applied automatically to later syncs; no repeated field-by-field micromanagement.
The exact initial preset still needs review before rollout.

## Honest privacy and departure

Application isolation protects members from other ordinary members and guild
roles. It does NOT make server-stored data inaccessible to the infrastructure
owner, who can inspect storage or change running code. The hosted-mode choice
must clearly identify that operator and this tradeoff before personal data is
stored. Do not advertise it as private from the GM or end-to-end encrypted.

Leaving disables future guild access, not deletion of canonical personal records.
Before rollout, document hosted access after departure, export availability,
retention/deletion deadlines, backups and recovery. An export/migration flow must
allow a member to move to their own backend without silently merging identities
or channels. Preserve logical Core identity through a verified ownership
transfer, rotate endpoint/pairing/peer credentials and review existing grants.
Copied disclosures/backups cannot be promised instantly erased.

## Mandatory implementation gates

- Trusted authentication maps each session, pair, OAuth callback and job to an
  exact member Core. A request-supplied Core ID is never authentication.
- Namespace storage keys and bounded indexes by member Core. Scope searches,
  caches, embeddings, voice tools, queues, logs and exports at the server too.
- Invitations cannot claim a public roster character, promote a member, or link
  another account by matching a name, guild string or Discord role.
- Source-side grant/projection checks remain mandatory on shared infrastructure.
  Do not filter a full personal record only in a browser or model.
- Record the payer and enforce per-member and guild budgets before paid work.
  Voice may stop at a cap without stopping normal sync. No author-owned keys.
- Test self-owned and hosted members together, tenant-ID substitution, stale
  invitations, cross-member pairing/OAuth/job routing, leaving and migration.
- Keep the service usable with all local gaming PCs off. Collecting new addon
  exports still requires that member's local companion/game session.

The current pure policy kernel is compatible with logical Core identities but
does not provide any of the hosting, authentication, storage or migration above.
