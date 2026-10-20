# Connect your own addons with a coding agent

WoW Core ships as its own tool. Other authors' addons are not bundled or required.
You choose what to install and what information matters to you. Separate optional
connections can make that information available through the same Core and agent.
You do not need to adopt a prescribed addon collection or a second interface.

This is an implementation guide, not a list of already working integrations.
The generic runtime currently implements the initial personal snapshot contract;
the complete addon/companion and adapter lifecycle are still planned. An agent
must inspect the current code and implement any missing ingestion/query contract,
not claim that dropping a file into a folder connects an arbitrary addon today.

## Describe the information you want

Start with the questions you want your agent to answer. For example:

| Your interest | Information a connection might provide | Example question |
| --- | --- | --- |
| Crafting | Learned recipes, reagent quantities, profession progress | Which character can make this, and what am I missing? |
| Inventory | Dated bags, bank or mailbox observations | Which of my characters last had this material? |
| Questing | Quest prerequisites, selected guide step, reference destinations | What unlocks this quest, and where should I go? |
| Collections | Missing appearances, mounts, pets or achievements | Which of my goals can I work on in this zone? |
| Trading | Market-scoped dated price observations | What price information do we actually have for this item? |
| Dungeon planning | A route or notes selected by the player | Explain the route I chose before I enter. |

These are examples, not a fixed catalog. An addon can contribute a different
part of your information needs. Its exposed data, game version, permissions and
author's interface determine what can actually be connected.

## Give your agent this request

> Connect the separately installed addons I choose to my own WoW Core. Ask which
> information and questions matter if I have not specified them. Inspect my actual
> addon versions and supported interfaces. Build separate optional adapters; do
> not bundle those addons with Core or make Core depend on them. Reuse existing
> Core observations instead of scanning the same thing twice. Preserve source,
> identity, game channel and original observation times. Make accepted information
> queryable through my existing Core agent. Implement and test collection,
> ingestion, storage, queries and absence behavior together. Report exactly what
> was tested and any data the addon does not expose. Keep my settings and saved
> data intact. Offer a generic connection example only after removing my data
> and configuration and checking the author's terms.

You can supply addon names, installed folders, versions or project links. An
agent should inspect only the addons relevant to your request; it does not need
to upload your entire installed-addon list or saved databases.

## Agent implementation procedure

1. **Inspect the current system.** Read repository instructions and the current
   snapshot and query schemas. Record the exact game/channel and addon version.
   Check whether native Core collection already provides the requested facts.
2. **Find the source interface.** Prefer a documented API, callback or explicit
   export. A background data service such as DataStore can be a useful source
   without adding another visible interface. Use existing authorized modules;
   consuming an API does not authorize creating a DataStore-compatible module.
   For internal saved formats, follow the opt-in version-specific review in
   [ADDON_INTEROP.md](ADDON_INTEROP.md). Explain unsupported cases honestly.
3. **Define a small contract.** Specify selected fields, types and meaning,
   supported versions/channels, character/account scope, source identifier,
   original observation time, collection time, partial coverage and limits.
   Keep game observations, third-party recommendations and player goals distinct.
4. **Keep the connection separate.** Put operator-selected adapter code and
   configuration outside the standard Core package. Install the source addon
   independently. The adapter must not edit its source/settings or silently
   install further addons. Core's basic sync and interface work when it is absent.
5. **Connect the complete data path.** Extend a versioned allowlisted snapshot
   schema where needed, validate on the backend, and merge into the existing
   canonical records by owning Core/channel/realm/GUID. Retain freshness and
   provenance. No second roster or name-only identity attachment.
6. **Give the agent useful reads.** Implement bounded filtered queries or tools
   for the requested questions. Index/paginate large collections. Return source,
   observation time and coverage with the answer. Never put the entire addon
   database into every model prompt. A scan without an agent-readable query is
   an incomplete connection.
7. **Prove the behavior.** Use invented fixtures for absent/disabled/late-loading
   addons, unknown versions, malformed and oversized values, duplicate/replayed
   data, old observations, conflicting identities and channel separation. Verify
   manual notes survive and failed adapters do not block ordinary sync. Measure
   data size and backend read/write budgets. Then verify the real selected data
   end to end without calling a synthetic test real-game acceptance.
8. **Leave maintenance instructions.** Document installation, enable/disable,
   supported versions, missing data, update checks and removal of the connection.
   Removing it stops future collection; retained dated history follows the
   owner's retention choices. Do not delete another addon's saved data.

## Multiple addons and overlapping information

Connections may coexist. Share native collection where possible and retain each
source's identity when sources disagree. Do not count the same inventory twice,
stamp cached observations as newly observed, equate asking prices with sales,
or turn a guide suggestion into completed quest progress. Let the owner select
which categories their agent can use. Guild/officer data remains a separately
authorized scope; installing an addon is not permission to export everything.

## Sharing what you built

You may offer original generic adapter examples and agent instructions after
review. Include supported interfaces/versions, limitations, tests and attribution.
Never include your account/character data, endpoints, credentials, SavedVariables
or someone else's addon payload. Users install their chosen addons themselves.
An adapter example is optional software, not a new dependency of WoW Core.
