# Player-owned WoW Core and guild federation

## Confirmed requirements

Each player chooses a self-owned Cloudflare deployment or an optional member
Core hosted by a guild operator. A guild owns a separate logical coordination
Core. Character ownership does not move when a member joins or leaves. The
companion talks to the player's Core; authorized guild information and actions
appear behind that same voice interface.

This repository builds the standalone player tool. The separately deployed
guild tool lives in [wowguild-core](https://github.com/TheFortThatHolds/wowguild-core).
These are software tools with technical setup instructions, not a course or a
centrally operated account platform. People, developers or AI coding agents can
configure them using their own resources. No private personal system is a dependency.

## Boundaries

The authoritative character key includes the owning Core ID, game channel,
realm and GUID. A Core ID should remain stable through domain changes and key
rotation. A human name, claimed guild name or remote record ID never proves
ownership. Handle absent or conflicting identifiers explicitly; fail rather
than silently merge different characters.

Core IDs are logical member identities, not Cloudflare account IDs. Hosted
members do not share one owner identity. See [docs/HOSTING.md](docs/HOSTING.md):
server-side isolation is required, but the operator controls the infrastructure.
Game/channel, region-qualified realm and guild identity are configurable. Public
Blizzard roster imports are unclaimed observations, not a second canonical list
or authority to provision accounts. Capability coverage is version-specific;
see [docs/BLIZZARD_DATA.md](docs/BLIZZARD_DATA.md).

The personal Core owns observed state and manual state separately. Stale addon
exports cannot overwrite newer observations or manual notes. Every accepted
new character gets empty, version-isolated baseline modules, not seeded data.

The guild Core owns memberships and shared planning records. Character views
are sourced from permission-filtered personal records, with source identity,
freshness and channel intact. A derived cache is not another canonical roster.
Guild planning writes cannot overwrite a player's observed character facts.

## Build order and acceptance gates

### 0. Public foundation — current checkpoint

- [x] Establish separate public repositories for the player and guild tools.
- [x] Record the ownership model, privacy boundary and staged plan.
- [x] MIT license selected for the generic public tool.

### 1. Standalone personal Core

- [ ] Define the storage, authentication, character and projection contracts.
- [ ] Build an owner-authenticated personal Core with configurable endpoints;
  no connection to the original builder's private infrastructure.
- [ ] Support optional guild-hosted member spaces with server-mapped identities,
  explicit operator-access disclosure, quotas, export and migration.
- [ ] Build bounded roster indexes and complete snapshot validation/merging.
- [ ] Make self-onboarding create the baseline modules automatically.
- [ ] Add private-by-default web sheets and addon/companion pairing.

Acceptance: two independently configured test owners sync invented characters
without manual sheet creation. Each sees only their own canonical records.
Forged owner hints, wrong GUIDs, stale exports and cross-channel reuse cannot
overwrite another character. Hot-path budgets remain bounded with many unrelated
records. No real private exports appear in the public repository or CI.
Repeat with two member Cores on one operator backend: swapping Core IDs, record
IDs, pairing tokens, OAuth sessions, search filters or voice arguments must fail.
Leaving cannot silently erase personal records; hosted retention/export must be
tested. Neither mode may rely on GM rank for protected Blizzard account access.

### 2. Guild permissions and federation

The player-side grant and projection implementation belongs here. Memberships,
guild roles, invitations, guild views and shared plans belong in wowguild-core.
Both tools must pin and test the same versioned federation contract.

- [x] Define membership/role/grant contract shapes and source projection kernel.
- [ ] Review the actual sharing preset before member rollout.
- [ ] Establish authenticated peer identity without exchanging infrastructure
  passwords or Cloudflare API tokens.
- [ ] Add scoped read-only character projections first; no arbitrary Core query.
- [ ] Enforce revocation at the source on every read. Define expiry, rotation,
  replay protection, endpoint restrictions and bounded cache retention.
- [ ] Add shared plans and officer actions under separate write permissions.
- [ ] Record security-relevant changes without logging private content/secrets.

Acceptance: two personal Cores connect to an independently configured guild
Core. A third uninvited player cannot read it. A member cannot read private
fields or another member's unshared characters, impersonate an officer, broaden
a grant or write to another personal Core. Leaving/revocation prevents new
reads, and expired caches are removed according to the disclosed policy.
Clients show unavailable/stale data honestly; a disconnected PC is not failure.

### 3. One voice, the same permissions

- [ ] Point the companion at the player's configured Core, not a fixed website.
- [ ] Keep one window and select from the actual permitted canonical roster.
- [ ] Add current-character freshness and scoped guild read/plan tools.
- [ ] Enforce authorization outside the model for every tool invocation.
- [ ] Add measured per-player/guild voice and optional-analysis allowances.

Acceptance: voice can read the player's current sync and permitted guild plans
without reconnecting. Prompt injection, spoofed tool arguments or a malicious
shared note cannot widen access or write another member's personal state. Paid
work stops at the configured cap without preventing ordinary sync.

### 4. Operator setup and distribution

- [ ] Document deployment/setup requirements for a fresh Cloudflare account, with
  minimal privileges, recovery and explicit cost expectations.
- [ ] Document the no-Cloudflare member path and the guild operator's provisioning,
  recovery, payer, retention and member-export responsibilities.
- [ ] Build the companion's endpoint/pairing flow and addon installation path.
- [ ] Provide clear return/back/reset paths without losing synced cloud records.
- [ ] Test a guild invitation from a brand-new player's account end to end.
- [ ] Check game-client compatibility and update/rollback behavior.
- [ ] Release only after license, privacy review and real-client evidence.

Acceptance: an operator, developer or AI coding agent can deploy and configure
the tools using documented requirements and their own accounts. A member can
then pair, sync, join and speak without creating character sheets. Cancelling
setup does not trap them. No step requires the project author's credentials or
keeping the guild leader's PC on. A self-service deployment wizard is optional,
not a prerequisite or an implied commitment to teach people to code.
Test both self-owned and guild-hosted members together in one configurable guild.
An unsupported game namespace must show partial/unavailable API coverage, not
borrow beta/release facts or block allowed local sync.

## Decisions still needed before the relevant stage

- Permission/provenance/privacy review before extracting any private code.
- Initial guild sharing preset, including what officers may see or edit.
- Player sign-in and peer authentication after reviewing current platform APIs.
- Who funds optional voice/analysis, and the default hard budget limits.
- Cache retention, withdrawal and shared-history behavior shown to members.

These do not block writing contracts and synthetic permission tests. Do not
pretend they are settled or silently make private information guild-visible.

## Verification policy

Read current official platform documentation before choosing deployment/auth
mechanisms. Test state, privacy, costs and invocation budgets before rollout.
Never treat repository existence, a deployment or a health response as proof of
working guild onboarding. Do not publish or deploy the personal reference code
as a shortcut.
