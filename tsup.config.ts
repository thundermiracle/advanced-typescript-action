import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/main.ts' },
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  // The action runs straight from dist/ with no install step, so everything
  // has to be inlined into the single bundle.
  noExternal: [/.*/],
  outExtension: () => ({ js: '.mjs' }),
  // Some transitive deps (e.g. tunnel) are CJS and call require() for node
  // builtins, which has no equivalent in an ESM bundle without this.
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module';\nconst require = __createRequire(import.meta.url);",
  },
  sourcemap: true,
  clean: true,
});
