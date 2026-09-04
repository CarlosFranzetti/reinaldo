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

test('the pricing rule has a single definition shared by app and API', async () => {
  const { PRICE_DISCOUNT } = await import('../data/catalog.js');
  assert.equal(typeof PRICE_DISCOUNT, 'number');
  const fs = await import('node:fs/promises');
  for (const file of ['../app.js', '../api/enrich.mjs']) {
    const src = await fs.readFile(new URL(file, import.meta.url), 'utf8');
    const imports = src.match(/^import \{([^}]*)\} from '[./]*\/?data\/catalog\.js';/m);
    assert.ok(imports, `${file} must import from data/catalog.js`);
    assert.ok(imports[1].split(',').map(x => x.trim()).includes('PRICE_DISCOUNT'),
      `${file} must import the shared discount rather than define its own`);
    assert.doesNotMatch(src, /\*\s*0\.8\b/, `${file} must not hard-code an old discount`);
  }
});

test('the seed catalogue is the only copy of the records', async () => {
  const { seed, toRecord } = await import('../data/catalog.js');
  assert.equal(seed.length, 38);
  const fs = await import('node:fs/promises');
  const app = await fs.readFile(new URL('../app.js', import.meta.url), 'utf8');
  const named = app.match(/^import \{([^}]*)\} from '\/data\/catalog\.js';/m);
  assert.ok(named, 'app.js must import the shared catalogue module');
  for (const want of ['seed', 'toRecord']) {
    assert.ok(named[1].split(',').map(x => x.trim()).includes(want), `app.js must import ${want}`);
  }
  const r = toRecord(seed[0]);
  for (const k of ['price', 'photo', 'highestPrice', 'discogsId']) assert.ok(k in r, `record needs ${k}`);
  assert.ok(!('askingPrice' in r), 'askingPrice was replaced by price');
});

test('duplicate detection does not flag the untouched seed catalogue', async () => {
  const { duplicateGroups, seed, toRecord } = await import('../data/catalog.js');
  const rows = seed.map(toRecord);
  // 22 of these are "Unknown" with no title; a naive comparison would merge them all
  assert.deepEqual(duplicateGroups(rows), []);
});

test('duplicate detection groups real copies and says why', async () => {
  const { duplicateGroups, seed, toRecord } = await import('../data/catalog.js');
  const rows = seed.map(toRecord);
  rows.push({ ...rows[0], number: 39 });                                  // outright copy
  rows.push({ ...rows[1], number: 40, discogsId: '', catno: '' });        // same artist+title only
  rows.push({ ...toRecord(seed[2]), number: 41, artist: 'Different', release: 'Thing' }); // shares catno
  const groups = duplicateGroups(rows);
  const byNumbers = groups.map(g => g.records.map(r => r.number).sort((a, b) => a - b));
  assert.ok(byNumbers.some(n => n.join() === '1,39'), 'the exact copy must group with #1');
  assert.ok(byNumbers.some(n => n.join() === '2,40'), 'artist+title alone must group');
  assert.ok(byNumbers.some(n => n.join() === '3,41'), 'a shared catalogue number must group');
  const first = groups.find(g => g.records.some(r => r.number === 39));
  assert.ok(first.reasons.length, 'a group must explain itself');
});

test('duplicate detection ignores blanks, Unknown and Various Artists', async () => {
  const { duplicateGroups } = await import('../data/catalog.js');
  const blank = n => ({ number: n, artist: '', release: '', catno: '', discogsId: '' });
  assert.deepEqual(duplicateGroups([blank(1), blank(2), blank(3)]), []);
  const unknown = n => ({ number: n, artist: 'Unknown', release: '', catno: '', discogsId: '' });
  assert.deepEqual(duplicateGroups([unknown(1), unknown(2)]), []);
  const various = n => ({ number: n, artist: 'Various Artists', release: '', catno: 'AB', discogsId: '' });
  assert.deepEqual(duplicateGroups([various(1), various(2)]), [], 'short catno and VA must not group');
});

test('duplicate detection merges records linked through a third', async () => {
  const { duplicateGroups } = await import('../data/catalog.js');
  const groups = duplicateGroups([
    { number: 1, artist: 'A', release: 'B', catno: 'XYZ1', discogsId: '' },
    { number: 2, artist: 'A', release: 'B', catno: '', discogsId: '' },      // matches 1 on artist+title
    { number: 3, artist: 'C', release: 'D', catno: 'XYZ1', discogsId: '' }   // matches 1 on catno
  ]);
  assert.equal(groups.length, 1, 'all three belong to one set');
  assert.deepEqual(groups[0].records.map(r => r.number).sort(), [1, 2, 3]);
});
