# Federation contract v1 — policy kernel

`src/federation.mjs` is the authoritative contract implementation shared with
wowguild-core. It is platform-neutral JavaScript, with no network, storage,
Cloudflare credentials, model calls or dependencies. The package is installable
from a pinned Git commit; it is not published to a package registry.

## Trust boundary

These functions are NOT authentication. Their `principal`, source `record`,
stored `grant`/membership and `now` must come from trusted server adapters.
Never populate principal identity/role from a request body, an addon guild name,
a Discord mention, model output or an unsigned caller claim. Future endpoints
must authenticate before calling this kernel, use the server clock, exact-read
current authorization state and persist transitions atomically.

There are no HTTP routes or signed peer authentication yet. Do not expose the
kernel directly as a callable web API. A passing pure-policy test does not prove
network security, persistent revocation or production readiness.

## Character identity and ownership

`character = {coreId, game, realm, guid}`; `characterKey` encodes the full tuple.
Do not use display names as keys or merge beta/release channels. Core IDs must
remain stable when endpoint domains or signing keys rotate. Provisioning and
actual Blizzard identity validation are future adapter responsibilities.

## Source-side sharing

Only the verified owner can create/revoke a grant. It names one guild Core,
one exact character, explicit sections and an expiry. No wildcard or empty
grant is accepted. Revoked/expired/not-yet-issued grants and wrong audiences or
characters fail before projection. Re-read the current source grant on each
request; a stale cached grant is not valid authority.

Allowed sections and fields:

| Section | Public projection fields |
| --- | --- |
| identity | name, class, race, faction |
| progression | level, itemLevel, zone |
| professions | name, skill, maxSkill per profession |
| gear | slot, itemId, itemLevel per equipped item |
| availability | role, available |

These are available scopes, not a default sharing preset. Selecting none means
no grant. Unknown/private fields are never copied, including nested fields.
Future scope changes require a reviewed contract version, not arbitrary JSON
paths supplied by the guild. No section accepts notes, bags, money or transcripts.

Every projection carries the selected character reference (including realm and
GUID), grant ID, source revision, observed/retrieved times and expiry as essential
provenance. Consent UI must disclose these identifiers. Missing observations
are omitted rather than fabricated. This first contract has a record-level
observation time; a later snapshot adapter must preserve per-section freshness.

## Membership and invitations

Membership and invitation schemas live here too so the guild tool does not
redefine them. Member roles are owner/officer/member. Invitations target one
authenticated personal Core, not whoever knows an invitation ID. Accepting and
officer approval are separate transitions. New approvals create member roles
only; they never create personal sharing grants or personal-Core write rights.

## Existing bots and integration

The tools supplement existing guild systems; they do not replace a Discord bot.
A future bot adapter may use a guild view only through the same authorization
boundary. A bot credential cannot become an owner credential. There is no bot,
Blizzard API client, Discord connection or remote fetch adapter in this version.

## Still required before federation

Verified peer authentication, signatures/audience, rotation, replay protection,
endpoint allowlists and SSRF defenses; atomic storage and bounded indexes;
withdrawal/cache retention semantics; operator setup and independent deployments.
Revocation can prevent new source reads, not make previously disclosed data unseen.
