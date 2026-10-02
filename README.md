# WoW Core

A World of Warcraft companion, with optional connections to any configured guild.

Players can run their own Core in their own Cloudflare account, or opt into a
member Core hosted by their guild operator. The guild coordination Core remains
a separate logical service. Joining grants selected character information,
not ownership of a player's records or their infrastructure credentials.
Guild-hosted application privacy is not privacy from the server operator.

## Two tools, independently owned

This repository is the player tool. [WoW Guild Core](https://github.com/TheFortThatHolds/wowguild-core)
is the separately deployed guild tool. Either can be configured without the
project author's infrastructure or accounts.

This is a software tool, not a course or a centrally operated account platform.
Operators may set it up themselves, use a developer or use an AI coding agent.
Documentation will cover requirements, configuration and connecting their own resources.

## Intended experience

1. Choose your own deployment or accept an optional guild-hosted member space.
2. Install and pair the companion and addon once.
3. Run `/wowcore sync` in game to onboard or update the current character.
4. Accept a guild invitation and approve the sharing policy.
5. Use one voice companion for your character and permitted guild information.

Guild-hosted members should need no Cloudflare account or developer keys. They
still sign in, consent and pair their own companion. Hosting does not reduce
addon sync coverage or authorize protected Blizzard data on their behalf.
See [docs/HOSTING.md](docs/HOSTING.md) and
[docs/BLIZZARD_DATA.md](docs/BLIZZARD_DATA.md) for the design and data boundaries.

Cloud services must remain usable when a player's PC is off. The local companion
is needed for local addon exports and in-game microphone controls, not to host
the guild service.

## Ownership and sharing

- Personal Core: canonical characters, observations, private notes and personal
  plans. Game channels, including beta and release, remain separate.
- Guild Core: memberships, roles, shared plans and permission-filtered views of
  participating characters. It is not a competing source of character truth.
- Sharing: explicit, revocable and limited to selected characters and fields.
  Private conversations, notes, bags, bank and money are not guild-visible by
  default. The exact initial sharing preset must be reviewed before rollout.
- Voice: the same authorization rules apply to every read and write tool.
  Prompts are not a security boundary.
- Leaving: revoke future guild access without deleting personal characters.
  Already disclosed information cannot be made unseen; caching and retention
  rules must be visible to members.
- Hosting: a guild operator can technically access data stored on their server.
  Members must be told this before choosing hosted mode. Export/migration and
  the hosted-space retention policy are required before that mode rolls out.

## Current status

This repository contains the version-1 sharing/membership contracts, a pure
source-side permission/projection kernel and synthetic tests. See
[docs/FEDERATION.md](docs/FEDERATION.md). There is no deployable public runtime,
installer, network authentication, hosted member provisioning or guild federation
yet. The steps above describe the target experience, not working installation commands.

Development checks (Node.js 22 or later): `npm run check` and `npm test`.
No dependencies, private accounts or model calls are needed for these tests.

Only generic code, schemas, synthetic tests and operator setup instructions
belong here. Never include private source configuration, records, transcripts,
credentials, account identifiers, local user paths or personal context graphs.
See [PUBLIC_BOUNDARY.md](PUBLIC_BOUNDARY.md).

Read [PLAN.md](PLAN.md) for the staged build and acceptance tests, and
[SESSION_HANDOFF.md](SESSION_HANDOFF.md) for the current checkpoint.

## License

MIT; see [LICENSE](LICENSE). The public tool stays freely reusable. Optional
setup/seed offerings must not restrict the rights granted by the code license.
Private-source extraction still requires provenance and privacy review.
