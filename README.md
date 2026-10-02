# WoW Core

A player-owned World of Warcraft companion, with optional guild connections.

Each player runs their own Core in their own Cloudflare account. A guild runs a
separate guild Core. Joining grants access to selected character information;
it does not transfer ownership of characters or give the guild access to a
player's Cloudflare account.

## Two tools, independently owned

This repository is the player tool. [WoW Guild Core](https://github.com/TheFortThatHolds/wowguild-core)
is the separately deployed guild tool. Either can be configured without the
project author's infrastructure or accounts.

This is a software tool, not a course or a hosted account platform. Operators
may set it up themselves, use a developer or use an AI coding agent. Documentation
will cover requirements, configuration and connecting their own resources.

## Intended experience

1. Deploy your personal Core into your own Cloudflare account.
2. Install and pair the companion and addon once.
3. Run `/wowcore sync` in game to onboard or update the current character.
4. Accept a guild invitation and approve the sharing policy.
5. Use one voice companion for your character and permitted guild information.

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

## Current status

This repository currently contains the implementation plan and builder rules.
There is no deployable public runtime, installer or guild federation yet. The
steps above describe the target experience, not working installation commands.

Only generic code, schemas, synthetic tests and operator setup instructions
belong here. Never include private source configuration, records, transcripts,
credentials, account identifiers, local user paths or personal context graphs.
See [PUBLIC_BOUNDARY.md](PUBLIC_BOUNDARY.md).

Read [PLAN.md](PLAN.md) for the staged build and acceptance tests, and
[SESSION_HANDOFF.md](SESSION_HANDOFF.md) for the current checkpoint.

## License

A reusable-code license has not been selected yet. Public repository visibility
alone is not an open-source license; settle licensing before distributing a
reusable release or importing code from private projects.
