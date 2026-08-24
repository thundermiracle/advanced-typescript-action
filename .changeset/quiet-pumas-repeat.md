---
'advanced-typescript-action': minor
---

Update the toolchain and all dependencies to their latest supported versions.

- Node.js `18.16.0` -> `24.19.0`, and the action runtime from `node16` to `node24`. This was required: pnpm 11 needs Node >= 22.13 and `@changesets/cli` 3 needs `^22.11 || ^24 || >=26`. CI had also been failing on Node 18 because corepack calls `URL.canParse`, which needs Node >= 18.17.
- pnpm `8.15.9` -> `11.23.0`. Build scripts now need explicit approval, so `pnpm-workspace.yaml` was added with an `allowBuilds` entry for `@swc/core` and `esbuild`.
- Migrate ESLint to flat config. `@web-configs/eslint-plugin` is incompatible with ESLint 10 (its bundled `@typescript-eslint` v6 parser breaks on the ESLint 10 scope manager API), so `eslint.config.js` now uses `typescript-eslint` v8 with `eslint-config-prettier`.
- `@actions/core` `1.11.1` -> `2.0.3`, `@changesets/cli` 2 -> 3, `@changesets/changelog-github` 0.7 -> 1, `tsup` 7 -> 8, `@types/node` 18 -> 24, plus patch updates for `@swc/core`, `@vercel/ncc` and Vitest.
- Add `node` to the `types` array in `tsconfig.json` so `@types/node` is actually loaded; `tsc --noEmit` now passes.
