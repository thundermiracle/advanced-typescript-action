# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **template** for building GitHub Actions in TypeScript. The value is the automation around the action (build/bundle chain, changesets releases, tag management, renovate integration) — not the action itself.

`src/main.ts` and `src/utils.ts` are a **placeholder stub** carried over from `actions/typescript-action`: `main.ts` sleeps for `milliseconds + 100` and sets a `time` output; `utils.ts` holds the `plus100ms` helper it calls. `action.yml` still has literal placeholders (`description: "your action's description"`, `author: 'Your name or organization here'`) and its `milliseconds` input exists only to feed the stub. A request to "implement the action" means replacing that code and rewriting `action.yml`'s metadata and inputs — not extending it.

## Commands

Package manager is pnpm 11.23.0 via corepack (`packageManager` in package.json); Node is pinned to 24.19.0 in `.nvmrc`. Both are floors, not preferences: pnpm 11 needs Node >= 22.13 and `@changesets/cli` 3 needs `^22.11 || ^24 || >=26`.

pnpm 10+ blocks dependency build scripts unless approved, and pnpm 11 reads settings from `pnpm-workspace.yaml` (**not** the `pnpm` field in package.json, which it silently ignores). `allowBuilds` there approves `@swc/core` and `esbuild`; without it `pnpm install` fails with `ERR_PNPM_IGNORED_BUILDS`. `pnpm approve-builds --all` rewrites that file for you.

```bash
pnpm build      # tsup: bundles src/main.ts -> dist/index.mjs (ESM, deps inlined)
pnpm test       # lint -> typecheck -> vitest run (coverage always on)
pnpm lint       # biome lint only
pnpm check      # biome check --write: lint fixes + format + import sorting
pnpm check:ci   # biome ci --error-on-warnings (what CI gates on)
pnpm typecheck  # tsc --noEmit, on TypeScript 7
pnpm format     # biome format --write
pnpm all        # build -> format -> test (the full pre-commit chain)
```

Single test file / single test — `pnpm test` lints first and can't take a filter, so call vitest directly:

```bash
pnpm exec vitest run __tests__/utils.test.ts
pnpm exec vitest run -t 'should return the input value plus 100'
pnpm exec vitest            # watch mode
```

## Build chain and the committed `dist/`

One stage: `tsup` (config in `tsup.config.ts`) bundles `src/main.ts` and every dependency into `dist/index.mjs`. The repo is `"type": "module"`, and `@actions/core` v3 is ESM-only, so the output is ESM.

Two non-obvious bits of `tsup.config.ts` that must not be dropped:

- `noExternal: [/.*/]` — the action runs straight from `dist/` with no install step, so nothing may stay external.
- the `createRequire` banner — CJS transitive deps (e.g. `tunnel`) call `require()` for node builtins, which throws `Dynamic require of "net" is not supported` in an ESM bundle without it.

**`dist/` is committed** (marked generated in `.gitattributes`) because `action.yml` runs `dist/index.mjs` directly on the runner.

Consequence: **any change under `src/` must be followed by `pnpm build`, with the resulting `dist/` committed.** Nothing enforces this — `test.yml` and `release.yml` both go install → run, with no build step and no `git diff --exit-code dist`. A stale bundle ships silently while CI stays green.

`action.yml` pins `using: 'node24'` (the runner's runtime for the bundle) independently of `.nvmrc` (the local/CI dev toolchain). They are pinned separately, so bumping one does not bump the other.

## Tests

Vitest with `globals: true` (`vitest.config.ts`) plus `types: ["vitest/globals", "node"]` in tsconfig — test files use `describe`/`it`/`expect` **without importing them**. Coverage is `enabled: true` in config, so it runs on every invocation, scoped to `src/**/*.ts`.

`__tests__/main.test.ts` is `describe.skip` and shells out to `lib/main.js` (a build artifact), so it only works after `pnpm build`. Real coverage is `utils.test.ts` alone.

## Lint and types

Linting and formatting are both **Biome** (`biome.json`). Biome is a single Rust binary with its own TypeScript parser — it has **no dependency on the `typescript` package**, which is the whole reason `typescript` can sit at a plain `^7.0.2` here. ESLint, typescript-eslint, Prettier, `eslint-config-prettier`, `@eslint/js` and `@web-configs/prettier` were all removed; so were `.eslintrc.js`, `.eslintignore`, `eslint.config.js` and `.prettierignore`.

**The one trap: Biome's `recommended` rules are warnings, and `biome lint` exits 0 on warnings.** A plain `biome lint` in CI silently passes with real findings. Hence `--error-on-warnings` everywhere it gates:

- `pnpm check:ci` → `biome ci --error-on-warnings` — verifies lint **and** formatting **and** import order without writing. This is what `pnpm test` runs, so CI now gates formatting, which the old eslint-only `test` script never did.
- `pnpm check` → `biome check --write` is the local autofix counterpart.

Formatter settings in `biome.json` reproduce the old `@web-configs/prettier` config exactly (lf, 2-space, single quotes, semicolons, trailing commas, bracket spacing) — the migration reformatted zero existing files.

`tsconfig.json` is self-contained. `@web-configs/typescript` was dropped because its base sets `baseUrl` and `moduleResolution: node`, both removed in TS 7, and an extended config cannot un-set them from the child. `moduleResolution` is `bundler` on purpose — `nodenext` would reject the extensionless relative import in `src/main.ts`.

The build does **not** type-check — tsup transpiles via esbuild. `pnpm typecheck` is wired into `pnpm test`, so CI covers it.

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
