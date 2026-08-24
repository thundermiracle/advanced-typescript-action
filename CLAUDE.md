# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **template** for building GitHub Actions in TypeScript. The value is the automation around the action (build/bundle chain, changesets releases, tag management, renovate integration) — not the action itself.

`src/main.ts` and `src/utils.ts` are a **placeholder stub** carried over from `actions/typescript-action`: `main.ts` sleeps for `milliseconds + 100` and sets a `time` output; `utils.ts` holds the `plus100ms` helper it calls. `action.yml` still has literal placeholders (`description: "your action's description"`, `author: 'Your name or organization here'`) and its `milliseconds` input exists only to feed the stub. A request to "implement the action" means replacing that code and rewriting `action.yml`'s metadata and inputs — not extending it.

## Commands

Package manager is pnpm 11.23.0 via corepack (`packageManager` in package.json); Node is pinned to 24.19.0 in `.nvmrc`. Both are floors, not preferences: pnpm 11 needs Node >= 22.13 and `@changesets/cli` 3 needs `^22.11 || ^24 || >=26`.

pnpm 10+ blocks dependency build scripts unless approved, and pnpm 11 reads settings from `pnpm-workspace.yaml` (**not** the `pnpm` field in package.json, which it silently ignores). `allowBuilds` there approves `@swc/core` and `esbuild`; without it `pnpm install` fails with `ERR_PNPM_IGNORED_BUILDS`. `pnpm approve-builds --all` rewrites that file for you.

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

`action.yml` pins `using: 'node24'` (the runner's runtime for the bundle) independently of `.nvmrc` (the local/CI dev toolchain). They are pinned separately, so bumping one does not bump the other.

## Tests

Vitest with `globals: true` (`vitest.config.ts`) plus `types: ["vitest/globals", "node"]` in tsconfig — test files use `describe`/`it`/`expect` **without importing them**. Coverage is `enabled: true` in config, so it runs on every invocation, scoped to `src/**/*.ts`.

`__tests__/main.test.ts` is `describe.skip` and shells out to `lib/main.js` (a build artifact), so it only works after `pnpm build`. Real coverage is `utils.test.ts` alone.

## Lint and types

ESLint uses **flat config** (`eslint.config.js`, CJS — the repo is not `type: module`): `@eslint/js` recommended + `typescript-eslint` v8 + `eslint-config-prettier`. There is no `.eslintrc.js`/`.eslintignore`; ignores live in the config's first block.

`@web-configs/eslint-plugin` was removed — it is unmaintained (0.5.2, peer `eslint: ^8.46.0`) and its bundled `@typescript-eslint` v6 parser crashes on ESLint 10 (`scopeManager.addGlobals is not a function`). `@web-configs/prettier` (prettier config) and `@web-configs/typescript` (tsconfig base) are still used.

Two upgrade constraints worth knowing before bumping either package:

- **TypeScript is held at 5.9.3** even though 7.x is latest. `typescript-eslint` peers on `typescript: >=4.8.4 <6.1.0` (canary included), so TS 7 means no TypeScript-aware linting at all.
- **`@actions/core` is held at 2.x** even though 3.x is latest. v3 is ESM-only and `ncc` emits CJS only, so `pnpm package` fails outright. Moving to v3 requires replacing ncc with an ESM bundler.

Nothing in the build type-checks — tsup transpiles via esbuild. Run `pnpm exec tsc --noEmit` explicitly when types matter.

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
