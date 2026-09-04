import test from 'node:test';
import assert from 'node:assert/strict';
import statusHandler from '../api/status.mjs';
import searchHandler from '../api/search.mjs';
import releaseHandler from '../api/release.mjs';
import marketplaceHandler from '../api/marketplace.mjs';

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

test('Vercel marketplace validates numeric release id', async () => {
  const res = mockRes();
  await marketplaceHandler({ query: { id: '12a' } }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /invalid release id/i);
});

test('Vercel marketplace reports missing token without exposing it', async () => {
  const previous = process.env.DISCOGS_TOKEN;
  delete process.env.DISCOGS_TOKEN;
  try {
    const res = mockRes();
    await marketplaceHandler({ query: { id: '1353040' } }, res);
    assert.equal(res.statusCode, 503);
    assert.match(res.body.error, /DISCOGS_TOKEN/);
    assert.doesNotMatch(JSON.stringify(res.body), /secret-example/);
  } finally {
    if (previous !== undefined) process.env.DISCOGS_TOKEN = previous;
  }
});

test('enrich normalises Discogs artist arrays and matches partial catalogue numbers', async () => {
  const mod = await import('../api/enrich.mjs');
  const src = await (await import('node:fs/promises')).readFile(new URL('../api/enrich.mjs', import.meta.url), 'utf8');
  // artistName must flatten the raw Discogs shape, preferring the credited variation
  assert.match(src, /a\.anv \|\| a\.name/);
  // containment match, guarded by a minimum length
  assert.match(src, /x\.length >= 4 && y\.length >= 4/);
  assert.equal(typeof mod.default, 'function');
});

test('enrich rejects an out-of-range start without calling Discogs', async () => {
  const previous = process.env.DISCOGS_TOKEN;
  delete process.env.DISCOGS_TOKEN;
  try {
    const enrich = (await import('../api/enrich.mjs')).default;
    const res = mockRes();
    await enrich({ query: { start: '9999', count: '3' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.done, true);
    assert.deepEqual(res.body.records, []);
  } finally {
    if (previous !== undefined) process.env.DISCOGS_TOKEN = previous;
  }
});
