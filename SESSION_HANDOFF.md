# WoW Core — public project checkpoint

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

## Next action

Start PLAN.md stage 1 with storage/auth/character/projection contracts and
synthetic authorization tests. Keep code independent of the original personal
Core. Before extracting private code or distributing reusable code, ask the
owner for a license decision. Review current official platform docs before
choosing Cloudflare deployment or authentication mechanisms.

After the initial empty-repository bootstrap, use branches, required checks and
routine PR merges. Update this same handoff with checks and remaining work.
Never mark the federation complete based only on this plan.
