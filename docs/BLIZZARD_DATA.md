# Blizzard data access — capability notes

Documentation checked 2026-10-02. This is an integration design, not a working
Blizzard client, a promise of every response field or a compatibility test.

## Guild access is not a GM super-permission

Blizzard documents four guild profile resources in both
[Retail](https://community.developer.battle.net/documentation/world-of-warcraft/profile-apis)
and [Classic](https://community.developer.battle.net/documentation/world-of-warcraft-classic/profile-apis):
guild profile, roster, activity and achievements. They are addressed by realm
and guild name. Ordinary documented guild reads use an application access token;
see [client credentials](https://community.developer.battle.net/documentation/guides/using-oauth/client-credentials-flow).
The reviewed documentation defines no extra GM-only OAuth scope. Do not infer
protected member-account access from guild rank.

The guild operator can import supported public roster/profile observations and
attach permitted character enrichment. Availability, returned fields and rank
representation require actual region/namespace response tests. Public roster
entries remain unclaimed observations until authenticated ownership/linking and
consent are established; importing one cannot create an authorized member or a
second canonical character. In-game rank and Core administrative roles are
different; a public rank or Discord role is not a login credential.

No reviewed guild API promises guild bank contents, private officer notes,
private member inventories or live presence. Do not advertise those as an API
feature. Any future addon guild observation must be reviewed against the
selected client's allowed APIs and the collector's actual permissions; never
work around unavailable data through memory inspection or gameplay automation.

## What comes from each member

Blizzard's account profile and protected-character resources require that
logged-in member's authorization with `wow.profile`, using
[authorization code OAuth](https://community.developer.battle.net/documentation/guides/using-oauth/authorization-code-flow).
A GM's authorization is not authorization for the guild's accounts. A personal
developer client is not necessary for each hosted member: the host application's
credentials and each member's separate user authorization serve different roles.
Never share one user's access token across members or embed it in the addon.

Retail documents character families including equipment, professions,
achievements, quests, reputations, encounters, specializations and collections.
Classic's documented character families are narrower, including profile,
equipment, appearance/media, hunter pets, PvP, specializations, statistics and
achievements. These are candidates for enrichment, not a universal all-games
checklist. More account data is not a reason to collect unrelated account details
or share them with a guild.

The member's `/wowcore sync` remains the source for allowed local observations
not provided by the web API. Self-owned and guild-hosted modes should collect the
same permitted snapshot. Without member OAuth or addon sync, the system has only
the available public observations; it must report missing data honestly. Allowed
personal collection and permission to share it with a guild are separate checks.

## Version, freshness and safe integration

Blizzard's [Retail namespaces](https://community.developer.battle.net/documentation/world-of-warcraft/guides/namespaces)
and [Classic namespaces](https://community.developer.battle.net/documentation/world-of-warcraft-classic/guides/namespaces)
separate game data by version and region. Those guides say character resources
refresh on logout and guild resources refresh periodically; they are not a
real-time snapshot of a member's current screen. No reviewed documentation
establishes Forever beta/release endpoint coverage, so it remains unverified.

Future adapters must report capabilities by game/channel, region, namespace and
resource, preserving source timestamps and partial/unavailable results. Qualify
realm identity by region in the adapter. A web API numeric character ID is not
an addon GUID; linking them needs verified identity mapping, not string guessing.
Keep beta and release observations, characters and mechanics entirely separate.
Unsupported API enrichment must not block permitted local sync.

Use bounded requests, caching and retry/backoff rather than scanning every
member on every voice turn. Respect the current
[getting-started limits](https://community.developer.battle.net/documentation/guides/getting-started)
and review the linked Developer API Terms before deployment, distribution or
monetization. Keep credentials/tokens in the intended server credential store;
store member consent and withdrawal state without exposing secrets in logs.
