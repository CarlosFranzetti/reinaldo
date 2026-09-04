import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from '../server.mjs';

async function withServer(fn) {
  const server = createServer({ token: '' });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  try { await fn(`http://127.0.0.1:${port}`); }
  finally { server.close(); await once(server, 'close'); }
}

test('status reports token state without exposing token', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/status`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { ok: true, tokenConfigured: false });
  });
});

test('search requires token', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/search?q=test`);
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.match(body.error, /DISCOGS_TOKEN/);
  });
});

test('serves index page', async () => {
  await withServer(async (base) => {
    const res = await fetch(base);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.match(text, /Vinyl Inventory/i);
  });
});

test('serves frontend assets', async () => {
  await withServer(async (base) => {
    for (const [pathname, type] of [
      ['/app.js', /javascript/],
      ['/styles.css', /text\/css/],
      ['/manifest.webmanifest', /manifest\+json/]
    ]) {
      const res = await fetch(`${base}${pathname}`);
      assert.equal(res.status, 200, `${pathname} should be served`);
      assert.match(res.headers.get('content-type'), type);
    }
  });
});

test('refuses dotfiles and server sources', async () => {
  await withServer(async (base) => {
    for (const pathname of ['/.env', '/server.mjs', '/api/_lib/discogs.mjs']) {
      const res = await fetch(`${base}${pathname}`);
      assert.equal(res.status, 403, `${pathname} should not be served`);
    }
  });
});
