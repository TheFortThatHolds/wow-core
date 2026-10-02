# WoW Core builder rules

Read PUBLIC_BOUNDARY.md before editing or publishing. This repository contains
the player tool; the separate wowguild-core repository contains the guild tool.
Offer software and technical setup instructions, not a course, consulting
program or hosted account platform.

## Product contract

- Players own their own Cloudflare deployments and canonical character data.
- A guild Core is independently owned; it receives scoped permissions, not
  personal infrastructure credentials or ownership of player records.
- No dependency on the original builder's accounts, email, domain, private Core,
  hardcoded characters or secrets. No requirement to deploy an entire personal
  productivity system just to use the WoW companion.
- One voice interface per player. Internal handlers are implementation details,
  not extra windows or assistants the player must manage.
- New characters self-onboard through `/wowcore sync`. Templates are versioned
  structure, never copied character state. Never make a second canonical roster.
- Identity includes owning Core, game channel, realm and character GUID. Names
  are display/search fields, not authorization. Beta and release never inherit
  each other's characters, notes, assets or game mechanics.

## Security and privacy

- Deny by default; enforce caller, owner, member role, character scope and field
  scope in server code, including voice tool calls and background jobs.
- Guild names in addon exports are observations, not membership proof. Begin
  with authenticated invitations and officer approval; do not invent automated
  membership verification on unsupported clients.
- Each user pairs only to their own Core. A pairing credential must never act as
  a guild administrator or authenticate as the original builder.
- Do not expose private records in public health, setup, diagnostic, search,
  embedding, log or error routes. Private data must remain private on AI failure.
- Before federation, specify signed peer identity, key rotation, revocation,
  replay defenses, approved endpoints, SSRF defenses and caching semantics.
- Never commit secrets, real exports, transcripts, personal IDs, local user
  paths, context graphs, production configuration, encrypted settings or
  diagnostic artifacts. Tests use invented identities and fixtures only.
  Inspect staged files before every public push.
- Stay inside Blizzard's allowed addon APIs. No gameplay automation, input
  injection, memory/traffic inspection or extra personal-data collection.

## Cost and execution

- Snapshot validation, identity routing, merging and sheet projection are
  deterministic. Optional AI advice is separate and must not block saving.
- Embeddings are inference too. Document actual indexing behavior and costs;
  never describe a model-backed write path as literally zero-model.
- Enforce per-player/guild limits before starting paid work. No unlimited shared
  key, silent fall-through to the builder's billing, or paid background loops.
- Cloudflare hot paths must not enumerate unrelated record bodies. Use bounded
  indexes/exact reads; maintenance is explicit, capped, versioned and resumable.
  Test invocation budgets at scale, not just with a handful of fixtures.
- Cloud operations must work without an always-on gaming PC.

## Workflow

- Read PLAN.md and SESSION_HANDOFF.md before changing scope. Record completed
  checks, limitations and the next action in the same handoff as work proceeds.
- Fetch before editing; preserve other work. Use isolated branches and ordinary
  review/checks/merges after the empty-repository bootstrap commit.
- Inspect scripts before running them. Do not deploy a service merely to prepare
  the checkout. Do not alter the existing personal installation for this project.
- Do not bulk-copy private implementation files. Resolve licensing and perform
  a privacy/dependency review before any extraction. Do not select a license on
  the owner's behalf.
- Do not claim deployed, secure, Blizzard-compatible or easy to install without
  the relevant evidence. A synthetic test is not a real-client test.
