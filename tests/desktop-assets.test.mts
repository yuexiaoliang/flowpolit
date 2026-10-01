import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { createAssetHandler } = require('../dist/desktop/asset-server.cjs');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/client');
const serve = createAssetHandler(root);

test('desktop app serves its entry point and built assets', async () => {
  const page = await serve(new Request('flowpilot://app/'));
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Flow Pilot/);
  const script = html.match(/<script[^>]+src="([^"]+\.js)"/)?.[1];
  assert.ok(script, 'built page must reference a JavaScript asset');
  const asset = await serve(new Request(`flowpilot://app${script}`));
  assert.equal(asset.status, 200);
  assert.equal(asset.headers.get('content-type'), 'text/javascript; charset=utf-8');
});

test('desktop app restores task routes without exposing local files', async () => {
  const route = await serve(new Request('flowpilot://app/task/article'));
  assert.equal(route.status, 200);
  assert.match(await route.text(), /Flow Pilot/);
  const missing = await serve(new Request('flowpilot://app/not-a-file.js'));
  assert.equal(missing.status, 404);
  const outside = await serve(new Request('flowpilot://other/'));
  assert.equal(outside.status, 404);
});
