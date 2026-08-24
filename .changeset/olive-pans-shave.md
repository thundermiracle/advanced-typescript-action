---
'advanced-typescript-action': minor
---

Take the two major upgrades that were held back last release: TypeScript 7 and `@actions/core` 3.

- `@actions/core` `2.0.3` -> `3.0.1`. v3 is ESM-only, so the action is now ESM (`"type": "module"`) and `ncc` is gone — `tsup` bundles `src/main.ts` and every dependency straight into `dist/index.mjs`. `action.yml` points at the new entry. The bundle shrinks from 1.05 MB to ~792 KB.
- TypeScript `5.9.3` -> `7.0.2`, using the TypeScript team's documented side-by-side layout. typescript-eslint throws on import under TS 7, so the package named `typescript` resolves to `@typescript/typescript6` (the 6.0 API) for the linter, while TS 7 is installed as `@typescript/native` and still provides `tsc`. Linting here is not type-aware, so nothing is lost. Revert to a plain `typescript` dependency once typescript-eslint supports TS >= 7.1.
- Drop `@web-configs/typescript`. Its base config sets `baseUrl` and `moduleResolution: node`, both removed in TS 7, and neither can be un-set from a child config. `tsconfig.json` is now self-contained.
- Add a `typecheck` script and wire it into `pnpm test`, so CI actually exercises TypeScript. Nothing type-checked before — tsup transpiles via esbuild.
- Remove `coverage.all` from `vitest.config.ts`; the option no longer exists in Vitest 4 and the new type check caught it.
