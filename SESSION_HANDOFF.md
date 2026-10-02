# WoW Core — public project checkpoint

## 2026-10-02: authenticated player runtime foundation (M1 first slice)

Original generic Worker implementation now maps a hashed, expiring/revocable
machine credential to one server-selected Core and one SQLite Durable Object.
Strict personal snapshot version 1 supports identity (including second name),
progression, professions and gear, not complete game coverage or legacy addon
exports. New records get empty version-isolated modules; sync preserves manual
notes, rejects stale/same-time-conflicting snapshots and records per-section
freshness. Private exact read, revision-guarded note writes and bounded canonical
roster pages with game/faction filters are implemented. No second roster.

Tests run the actual Worker with Cloudflare Miniflare/SQLite, persistence across
restart, concurrent snapshots, separate deployments and hosted owner isolation.
SQLite instrumentation verifies covering indexes and fixed query counts at 500
synthetic characters. This is local runtime evidence, not production billing/load,
deployment, human login, real-game/voice or federation evidence. Only invented data
and generated throwaway credentials are tested; private installation is unchanged.

Bootstrap registry: backend secret, maximum 16 credentials/4096 bytes, owner-only
machine permissions. Not human OAuth, guild permissions or scalable provisioning.
Config has no public endpoint/account IDs/secrets. No external API/model calls,
embeddings, background jobs or implicit billing. Development-only Miniflare is
pinned; audited sharp/undici overrides are regression-tested. Installation scripts
are disabled. See docs/RUNTIME.md for exact routes, semantics, budgets and limits.

Persistent per-Core write caps (120/minute, 2000/UTC day) commit with record changes,
survive restart and preserve read access/unchanged retries when exhausted.
Edge/read-request limits and overall spending controls remain rollout gates.

Next: M1 edge/read abuse controls and secure provisioning/recovery; then
M2 human identity/hosted onboarding/OAuth, M3 persistent guild policies, M4 peer
federation, M5 complete allowed collectors and one UI/voice, M6 GM/addon adapters,
M7 operator/real-client release gates. Do not expose this as a public member
signup system or claim installed-addon compatibility. Preserve the guild repo's
existing immutable contract pin: federation source API has not changed.

Verification: 34 player tests pass (16 existing policy tests plus local runtime/
storage cases and their subtests). Syntax and audit checks pass with zero reported
dependency vulnerabilities; all 16 guild regression tests also pass (50 combined).
Clean dependency installation with scripts disabled and package dry-run passed.
Review staged artifacts and CI before merging. The execution
track is saved in PLAN.md; keep this same handoff current as work proceeds.

## 2026-10-02: post-join tooling and addon interoperability

Scope correction: the system serves existing guild members. Recruitment and
joining the in-game guild are outside scope; Core access invitations remain
separate authentication/consent gates. Complement existing addons rather than
replace quest/navigation/raid/loot workflows. Keep personal and GM guild sync
separate in collectors, data, authorization and storage destinations.

Added docs/ADDON_INTEROP.md with adapter boundaries, source/version/freshness,
candidate integration research, conflict/absence tests and separate CurseForge
publishing versus catalog-API paths. No whole addon databases, installed-addon
inventory, guide packs, private messages or executable imports may be uploaded.
Installed code was inspected read-only; no third-party source, user state or
configuration was copied into this repository. Candidate research is not tested
compatibility. No collector, action tool, CurseForge application or release was
implemented/submitted, and no installed addon was changed.

Existing policy suites are unchanged. Next remains authenticated storage and
isolation, with small reviewed optional adapters after their schema/privacy gates.
Save test/merge receipts with this checkpoint; do not advertise blanket addon
support or infer Blizzard permission from another addon's behavior.

Verification: all 32 existing local policy tests, both syntax checks and package
dry-runs passed. Source policy code was not changed; these are regression checks,
not addon coexistence, CurseForge approval or real-client integration evidence.

Catalog lookup is a deferred addon-builder research aid, not a runtime feature
of this project or source of player saved state. Public project pages support
current research; no separate developer-tool API application was submitted.

## 2026-10-02: optional guild hosting and API capability design

Latest requirements supersede mandatory per-player Cloudflare wording below.
Guild-agnostic configuration supports self-owned deployments and optional
guild-hosted member Cores. Each member keeps a distinct logical Core identity
and canonical records; hosted mode is not one shared owner account. Members must
be told the operator controls the server and can technically access stored data.
Export/migration, retention, cost limits and server-side isolation are rollout
gates, not implemented features. See docs/HOSTING.md.

Official Blizzard documentation was inspected on 2026-10-02. Guild profile,
roster, activity and achievements are documented for Retail and Classic; no
GM-only permission is documented. Account/protected-character data requires
that member's OAuth authorization and wow.profile scope. Hosting location does
not change this. Game/namespace support and freshness must be tested separately;
no Forever beta/release coverage is claimed. See docs/BLIZZARD_DATA.md.

This change is design/documentation only; the policy implementation is unchanged.
Both suites still have 16 synthetic tests each, with no network or hosted-runtime
claim. The next implementation gate is authenticated storage with exact member
identity mapping, cross-tenant denial tests and bounded platform-call budgets.
Do not deploy a public multi-member endpoint around the unauthenticated kernel.

Verification for this checkpoint: 32 local tests, both syntax checks and both
package dry-runs passed. Reviewed public diffs/package file lists; local Markdown
links, whitespace and private-value scans passed. No runtime service was changed.

## 2026-10-02: first policy implementation

This section supersedes the planning-only status below. Original generic code
now implements contract v1: exact player/game/realm/GUID identity; owner-created
per-character grants; audience, expiry and revocation checks; source-side
allowlisted projections; shared invitation/membership schemas. MIT was approved
and added. There is no import of private implementation code or data.

Local checks: syntax check and all 16 synthetic tests passed; package dry-run
contains only LICENSE, README.md, package.json, src/federation.mjs and
docs/FEDERATION.md. No network, model, storage or deployment operation is part
of the kernel. GitHub CI runs the same checks without secrets or deployment.

IMPORTANT: principal identity, current authorization state and clock are trusted
server-adapter inputs, not user claims. This kernel is not network authentication
or persistent storage. Real peer verification, atomic persistence/revocation,
SSRF/replay defenses, bounded indexes, snapshot merging, installer and voice
integration remain unbuilt. Missing observations are omitted, not invented.

Existing guild bots are complements, not replacement targets. A future adapter
may read only approved guild projections. No Discord bot or external system is
connected, and no sale/checkout or paid seed has been created.

Both first implementation PRs are merged: wow-core #1 and wowguild-core #1.
Their GitHub PR CI checks passed (player run 37063231792, guild run 37063886259).
The guild kernel consumes the immutable player source commit and its 16 tests
passed too: 32 synthetic tests across both projects. Guild approval/withdrawal
are proposed policy transitions, not live network/persistent operations.

Next: implement trusted authenticated storage adapters, not an unauthenticated
HTTP wrapper around these functions. Keep the implementation plan and same
handoff current; do not treat policy tests as deployed federation evidence.

## 2026-10-02: repository identified and foundation started

Repository: https://github.com/TheFortThatHolds/wow-core

The repository was public and empty when inspected. It is the standalone player
tool; the separate guild tool is https://github.com/TheFortThatHolds/wowguild-core.
No private installation or service was changed.

Each player owns their own Cloudflare Core and characters; guilds own separate
guild Cores.
Joining grants scoped access, not ownership or infrastructure credentials.

Files added: README.md, PLAN.md, AGENTS.md, PUBLIC_BOUNDARY.md,
SESSION_HANDOFF.md and .gitignore.
This checkpoint is planning/documentation only. No runtime, guild authorization,
installer, voice federation, public website or deployment has been built or
verified in this repository yet. No private source/data/configuration was copied.
Only generic public-facing tools and technical setup instructions belong here;
no course, consulting program or hosted account platform is planned.

Verification: reviewed the six explicitly staged files, checked the diff for
whitespace errors, checked local Markdown links and scanned for personal values,
identifiers, credentials and local paths. These documentation checks passed;
there is no runtime test or deployment claim.

## Historical bootstrap next action

Start PLAN.md stage 1 with storage/auth/character/projection contracts and
synthetic authorization tests. Keep code independent of the original personal
Core. Before extracting private code or distributing reusable code, ask the
owner for a license decision (resolved: MIT). Review current official platform docs before
choosing Cloudflare deployment or authentication mechanisms.

After the initial empty-repository bootstrap, use branches, required checks and
routine PR merges. Update this same handoff with checks and remaining work.
Never mark the federation complete based only on this plan.
