---
'advanced-typescript-action': minor
---

Replace ESLint and Prettier with [Biome](https://biomejs.dev/).

Biome is a single Rust binary with its own TypeScript parser, so it does not depend on the `typescript` package at all. That is what lets `typescript` stay on a plain `^7.0.2` — typescript-eslint refuses to load under TypeScript 7, and working around it would have meant installing TypeScript 6 side by side just to satisfy the linter.

- Removed: `eslint`, `typescript-eslint`, `@eslint/js`, `eslint-config-prettier`, `prettier`, `@web-configs/prettier`, plus `eslint.config.js` and `.prettierignore`. `devDependencies` drop from 15 to 9.
- `biome.json` reproduces the previous formatting settings exactly (lf, 2-space indent, single quotes, semicolons, trailing commas, bracket spacing). Migrating reformatted zero existing files.
- **Behaviour change:** `pnpm test` now also gates formatting and import order, via `biome ci --error-on-warnings`. The old ESLint-only script checked lint rules only.
- Note for anyone editing the scripts: Biome's recommended rules are warnings, and plain `biome lint` exits 0 on warnings. Every gating command passes `--error-on-warnings`, otherwise CI reports success while findings go unaddressed.
