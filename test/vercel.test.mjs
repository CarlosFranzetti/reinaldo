import test from 'node:test';
import assert from 'node:assert/strict';
import statusHandler from '../api/status.mjs';
import searchHandler from '../api/search.mjs';
import releaseHandler from '../api/release.mjs';

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    setHeader(k, v) { this.headers[k] = v; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('Vercel status does not expose the token', async () => {
  process.env.DISCOGS_TOKEN = 'secret-example';
  const res = mockRes();
  await statusHandler({ query: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true, tokenConfigured: true });
  assert.doesNotMatch(JSON.stringify(res.body), /secret-example/);
});

test('Vercel search rejects blank query without contacting Discogs', async () => {
  const res = mockRes();
  await searchHandler({ query: { q: '   ' } }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /required/i);
});

test('Vercel release validates numeric release id', async () => {
  const res = mockRes();
  await releaseHandler({ query: { id: 'abc' } }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /invalid release id/i);
});
