import assert from 'node:assert/strict';
import test from 'node:test';
import { clampPanelBounds, webPageBounds } from '../apps/desktop/electron/web-page-layout.ts';
import {
  allowsPageNavigation,
  allowsPageRequest,
} from '../apps/desktop/electron/web-page-policy.ts';

test('web page leaves the task navigation controls uncovered', () => {
  assert.deepEqual(webPageBounds(1024, 700), { x: 0, y: 84, width: 1024, height: 616 });
});

test('external test pages allow their own documents and realtime connection only', () => {
  assert.equal(allowsPageNavigation('http://home.ts-ali.internal:3000/new'), true);
  assert.equal(
    allowsPageRequest('ws://home.ts-ali.internal:3000/socket.io/?transport=websocket'),
    true,
  );
  for (const url of [
    'http://home.ts-ali.internal.evil:3000/',
    'http://home.ts-ali.internal:3001/',
    'https://home.ts-ali.internal:3000/',
    'http://user@home.ts-ali.internal:3000/',
    'flowpilot://app/',
    'flowpilot://fixture/local-page/index.html',
    'file:///etc/passwd',
    'not a URL',
  ]) {
    assert.equal(allowsPageNavigation(url), false, url);
    assert.equal(allowsPageRequest(url), false, url);
  }
  assert.equal(allowsPageNavigation('ws://home.ts-ali.internal:3000/socket.io/'), false);
});

test('resizing and dragging cannot lose the panel outside the page viewport', () => {
  const moved = clampPanelBounds({ x: 1500, y: 850, width: 427, height: 420 }, 1024, 700);
  assert.deepEqual(moved, { x: 597, y: 280, width: 427, height: 420 });
  const above = clampPanelBounds({ ...moved, x: -500, y: -500 }, 1024, 700);
  assert.equal(above.x, 0);
  assert.equal(above.y, 84);
});
