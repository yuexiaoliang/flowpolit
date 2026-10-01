import { packager } from '@electron/packager';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2];
if (!['mac', 'linux'].includes(target)) throw new Error('Choose mac or linux');

const stage = path.join(root, '.desktop-stage');
const out = path.resolve(root, '../desktop-builds');
await rm(stage, { recursive: true, force: true });
await mkdir(path.join(stage, 'desktop'), { recursive: true });
await cp(path.join(root, 'dist/client'), path.join(stage, 'dist/client'), { recursive: true });
await cp(path.join(root, 'desktop/main.cjs'), path.join(stage, 'desktop/main.cjs'));
await cp(path.join(root, 'desktop/asset-server.cjs'), path.join(stage, 'desktop/asset-server.cjs'));
await writeFile(path.join(stage, 'package.json'), JSON.stringify({
  name: 'flow-pilot',
  productName: 'Flow Pilot',
  version: '0.2.0',
  description: 'Flow Pilot desktop task client',
  main: 'desktop/main.cjs',
  author: 'Flow Pilot',
  license: 'UNLICENSED',
}, null, 2));

const paths = await packager({
  dir: stage,
  out,
  name: 'Flow Pilot',
  executableName: 'Flow Pilot',
  platform: target === 'mac' ? 'darwin' : 'linux',
  arch: target === 'mac' ? 'arm64' : 'x64',
  appBundleId: 'app.flowpilot.prototype',
  appCategoryType: 'public.app-category.productivity',
  icon: path.join(root, target === 'mac' ? 'desktop/icon.icns' : 'desktop/icon.png'),
  asar: true,
  overwrite: true,
  osxSign: false,
});
console.log(paths.join('\n'));
