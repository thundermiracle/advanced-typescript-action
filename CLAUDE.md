# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **template** for building GitHub Actions in TypeScript. The value is the automation around the action (build/bundle chain, changesets releases, tag management, renovate integration) — not the action itself.

`src/main.ts` and `src/utils.ts` are a **placeholder stub** carried over from `actions/typescript-action`: `main.ts` sleeps for `milliseconds + 100` and sets a `time` output; `utils.ts` holds the `plus100ms` helper it calls. `action.yml` still has literal placeholders (`description: "your action's description"`, `author: 'Your name or organization here'`) and its `milliseconds` input exists only to feed the stub. A request to "implement the action" means replacing that code and rewriting `action.yml`'s metadata and inputs — not extending it.

## Commands

Package manager is pnpm 8.15.9 via corepack (`packageManager` in package.json); Node is pinned to 18.16.0 in `.nvmrc`.

```bash
pnpm build      # tsup: src/**/*.ts -> lib/ (code-split, cleans lib/ first)
pnpm package    # ncc: bundles lib/main.js -> dist/index.js (+ sourcemap, licenses.txt)
pnpm test       # eslint src/**/*.ts, THEN vitest run (coverage always on)
pnpm lint       # eslint only
pnpm format     # prettier --write '**/*.ts'
pnpm all        # build -> format -> test -> package (the full pre-commit chain)
```

Single test file / single test — `pnpm test` lints first and can't take a filter, so call vitest directly:

```bash
pnpm exec vitest run __tests__/utils.test.ts
pnpm exec vitest run -t 'should return the input value plus 100'
pnpm exec vitest            # watch mode
```

## Build chain and the committed `dist/`

Two stages, and the order is load-bearing: `ncc` has no entry argument, so it resolves package.json's `main` (`lib/main.js`), which only exists after `tsup` has run. **`pnpm package` requires a prior `pnpm build`.**

`lib/` is gitignored; **`dist/` is committed** (marked generated in `.gitattributes`) because `action.yml` runs `dist/index.js` directly on the runner with no install step.

Consequence: **any change under `src/` must be followed by `pnpm build && pnpm package`, with the resulting `dist/` committed.** Nothing enforces this — `test.yml` and `release.yml` both go install → run, with no build step and no `git diff --exit-code dist`. A stale bundle ships silently while CI stays green.

`action.yml` pins `using: 'node16'` (the runner's runtime for the bundle) independently of `.nvmrc` (the local/CI dev toolchain).

## Tests

Vitest with `globals: true` (`vitest.config.ts`) plus `types: ["vitest/globals"]` in tsconfig — test files use `describe`/`it`/`expect` **without importing them**. Coverage is `enabled: true` in config, so it runs on every invocation, scoped to `src/**/*.ts`.

`__tests__/main.test.ts` is `describe.skip` and shells out to `lib/main.js` (a build artifact), so it only works after `pnpm build`. Real coverage is `utils.test.ts` alone.

Lint/prettier/tsconfig all come from the external `@web-configs/*` packages; local overrides are the few rules in `.eslintrc.js`.

## Releases: changesets → tag → major re-tag

1. **Every PR needs a changeset.** `test.yml` runs `pnpm changeset status --since origin/main` and fails without one. Add via `pnpm exec changeset`.
2. `release.yml` (push to `main`) runs `changesets/action`, which opens a `chore(release): release package` PR bumping the version and rewriting `CHANGELOG.md`.
3. Merging that PR runs `pnpm cs:tag`, creating the semver tag (`v1.2.3`).
4. `tag-update.yml` fires on `v*` tags containing a `.`, then force-moves the major alias (`v1`) to that commit by deleting and re-pushing it — so consumers can pin `@v1`.

This needs a `PAT_GITHUB` secret (repo + workflow scopes); the default `GITHUB_TOKEN` won't work because tag/commit pushes must retrigger workflows.

`renovate-changesets.yml` auto-generates and amends a changeset onto renovate PRs (which is why the history is almost entirely `chore(deps)` commits with changesets attached).

## When forking this template

Beyond `src/` and `action.yml`, these carry the original repo's identity and will misbehave otherwise:

- `.github/workflows/renovate-changesets.yml` — guarded by `github.repository == 'thundermiracle/advanced-typescript-action'`; a fork that doesn't edit this literal gets a workflow that silently no-ops.
- `.changeset/config.json` — `changelog` is bound to the `thundermiracle/advanced-typescript-action` repo for changelog links.
- `renovate.json` — extends the `github>thundermiracle/.github` preset.
- `package.json` `name` — changesets keys entries by it, so existing `.changeset/*.md` files reference the old name.
