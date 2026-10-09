import { build } from 'esbuild';

await build({
  entryPoints: [
    'apps/desktop/electron/main.ts',
    'apps/desktop/electron/asset-server.ts',
    'apps/desktop/electron/preload.ts',
  ],
  outdir: 'dist/desktop',
  outExtension: { '.js': '.cjs' },
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  external: ['electron'],
});
