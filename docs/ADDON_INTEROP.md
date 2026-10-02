# Addon interoperability — data-first design

WoW Core supplements a player's/guild's existing toolkit. It is post-join guild
tooling, not recruitment, guild-finder or an in-game guild admission system.
Core invitations authorize access for existing members; they do not invite,
promote or remove characters in WoW. Those are separate game actions.

## Separate sync tools

- Personal `/wowcore sync`: allowed current-character observations and approved
  optional addon context go to that player's canonical personal Core.
- Proposed GM `/wowguild sync`: reviewed guild observations go to Guild Core
  with separate collector, schema, credentials, permissions and restricted views.

The tools may share packaging/companion transport but never mix payloads or turn
a GM's personal pairing into guild administration. Restricted guild information
stays restricted in search, voice, caches and exports. GM access does not grant
members' private character state. Guild collection capabilities are unverified
per client until actual API tests; opening a relevant game window may be needed.

## Integration order

1. Prefer Blizzard APIs for ordinary observed game facts.
2. Use another addon's documented API, callbacks or explicit exports for context
   that it adds, preserving its source and meaning.
3. If only internal state/SavedVariables exists, require a reviewed opt-in
   version-specific adapter and read only a small allowlist. Missing/unknown
   formats are unavailable, not permission to dump or guess the whole database.

Copy only necessary data into WoW Core's own bounded snapshot envelope. Do not
execute imported SavedVariables, scrape UI text/screens, modify foreign saved
state, collect the whole installed-addon list or ingest arbitrary code/guide packs.
Do not load private notes/chats/officer history through a broad addon-table import.
Source licensing/privacy review is required before copying any third-party code.

Each adapter must declare source/version, supported client/channel, schema,
selected fields, owner/scope, observation time, size/count caps and missing/stale
behavior. Guide recommendations, skipped steps and addon-derived advice are not
Blizzard-confirmed quest completion. Reuse canonical character identity; addon
names, guide titles and waypoint labels are not record ownership keys.

## Candidate research, not implemented support

| Source | Possible selected context | Boundary |
| --- | --- | --- |
| TomTom | Active destination map/coordinates and distance | Documented waypoint APIs exist; do not seize another provider's arrow |
| Forever GuideMate | Selected guide/goal and guide progress | Internal state is not a stable public export contract; version-gated review needed |
| Questie | Quest-related context beyond native observations | Review its current supported interfaces and exact game flavor first |
| Guild/raid/loot tools such as RCLootCouncil | Explicitly approved assignments or history summaries | Review exports, member privacy and officer restrictions; no blanket table import |

Primary project references:
[TomTom](https://www.curseforge.com/wow/addons/tomtom),
[Forever GuideMate](https://github.com/TylerAkins/forever-guide-mate),
[Questie](https://github.com/Questie/Questie),
[RCLootCouncil](https://github.com/evil-morfar/RCLootCouncil2).
Do not require these addons for ordinary sync. Compatibility varies by addon
version and game; a project name in this table is not a support promise.

Data collection is the initial scope. Existing addons retain their controls,
quest handling, navigation, raid execution and loot decisions. No injected
clicks/keys, movement, combat or game actions are added. Any future local action
integration needs separate user authorization, current Blizzard/client review
and tests; another addon's implementation is not proof an action is permitted.

## Acceptance gates

Test absent/disabled addons, delayed loading, unknown versions, changed schemas,
malformed/oversized state, stale data and personal/guild scope substitution.
Test multiple waypoint providers without clearing/replacing their destinations,
no foreign writes, no extra windows, no taint/protected-action interference,
bounded event/polling costs and failure not blocking ordinary sync. Synthetic
fixtures must be original and invented, never real saved addon databases.

## CurseForge distribution is separate from its API

[Author project submission](https://support.curseforge.com/support/solutions/articles/9000197241-creating-and-submitting-a-project)
uses project metadata/license, an addon archive, supported game versions and
moderation. Only source-clean generic addon packages are candidates; never bundle
operator settings, credentials, real exports or third-party addons without rights.
No author project or file submission has been made for these public tools.

The [third-party catalog API terms](https://support.curseforge.com/support/solutions/articles/9000207405-curse-forge-3rd-party-api-terms-and-conditions)
are a different integration. Local addon interoperability does not call that API.
Catalog lookup could help a separate addon-development/research workflow discover
projects, compare game-version/dependency information and locate source/docs.
It is not a planned runtime feature of WoW Core or Guild Core. Catalog metadata
is not player saved state, a stable data-export contract or proof of compatibility.
Current research can use public project pages; a separate developer-tool API
application is deferred, not part of this build.
No catalog/download manager is needed for the initial design. If proposed later,
review author distribution approval, key non-sharing, quotas, caching restrictions
and competition terms before applying or building it. Do not promise a shared API
key to independent guild operators. Do not submit an application, accept terms or
claim monetization approval merely because the project has a public MIT license.
