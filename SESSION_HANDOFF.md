# WoW Core — public project checkpoint

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
