import { discogsFetch, handleError, sendJson } from './_lib/discogs.mjs';
import { seed, toRecord } from '../data/catalog.js';

const MAX_COUNT = 6;

function norm(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }

// Same rule the browser uses: link only on an exact catalogue number, or when
// both artist and title appear in the result title. Anything vaguer is left
// unlinked rather than filled with the wrong pressing.
function confident(r, x) {
  if (r.catno && x.catno && norm(r.catno) === norm(x.catno)) return true;
  const title = norm(x.title);
  return Boolean(r.artist && r.release && title.includes(norm(r.artist)) && title.includes(norm(r.release)));
}

function applyRelease(r, j) {
  r.artist = j.artists || r.artist;
  r.release = j.title || r.release;
  r.year = String(j.year || r.year || '');
  r.country = j.country || r.country;
  if (j.labels?.[0]) { r.label = j.labels[0].name || r.label; r.catno = j.labels[0].catno || r.catno; }
  r.discogsUrl = j.uri ? (String(j.uri).startsWith('http') ? j.uri : `https://www.discogs.com${j.uri}`) : r.discogsUrl;
  r.tracks = (j.tracklist || []).map(t => `${t.position} ${t.title}${t.duration ? ' ' + t.duration : ''}`.trim()).join('; ') || r.tracks;
  r.unresolved = false;
}

async function enrichOne(record) {
  const note = { number: record.number, linked: false, matched: false, reason: '' };
  if (!record.discogsId) {
    const q = [record.artist, record.release, record.catno].filter(Boolean).join(' ').trim();
    if (!q) { note.reason = 'Nothing to search on'; return note; }
    const sr = await discogsFetch(`/database/search?type=release&per_page=12&q=${encodeURIComponent(q)}`);
    const hit = (sr.results || []).find(x => confident(record, {
      title: x.title, catno: x.catno
    }));
    if (!hit) { note.reason = 'No confident match'; return note; }
    record.discogsId = String(hit.id);
    note.linked = true;
  }
  const rel = await discogsFetch(`/releases/${record.discogsId}`);
  applyRelease(record, rel);
  note.matched = true;
  try {
    const m = await discogsFetch(`/marketplace/stats/${record.discogsId}`);
    record.numForSale = m.num_for_sale ?? '';
    record.lowestPrice = m.lowest_price?.value ?? '';
    record.currency = m.lowest_price?.currency ?? record.currency;
    record.marketplaceStatus = 'Available';
  } catch (err) {
    record.marketplaceStatus = 'Unavailable';
    note.reason = err.message || 'Marketplace unavailable';
  }
  try {
    const raw = await discogsFetch(`/marketplace/price_suggestions/${record.discogsId}`);
    const entries = Object.entries(raw || {})
      .map(([condition, v]) => (v && Number.isFinite(Number(v.value)) ? { condition, value: Number(v.value), currency: v.currency || '' } : null))
      .filter(Boolean).sort((a, b) => b.value - a.value);
    if (entries.length) {
      record.highestPrice = entries[0].value;
      record.highestCondition = entries[0].condition;
      if (!record.currency) record.currency = entries[0].currency;
      record.price = (Math.round(entries[0].value * 0.8 * 100) / 100).toFixed(2);
    }
  } catch (err) {
    record.suggestionsReason = err.message || 'Price suggestions unavailable';
  }
  return note;
}

export default async function handler(req, res) {
  try {
    const start = Math.max(0, Number(req.query?.start ?? 0) || 0);
    const count = Math.min(MAX_COUNT, Math.max(1, Number(req.query?.count ?? 3) || 3));
    if (start >= seed.length) return sendJson(res, 200, { total: seed.length, start, records: [], notes: [], done: true });

    const slice = seed.slice(start, start + count).map(toRecord);
    const notes = [];
    let rateLimited = false;
    for (const record of slice) {
      try {
        notes.push(await enrichOne(record));
      } catch (err) {
        if (err.status === 429) { rateLimited = true; notes.push({ number: record.number, linked: false, matched: false, reason: 'Rate limited' }); break; }
        notes.push({ number: record.number, linked: false, matched: false, reason: err.message || 'Failed' });
      }
    }
    return sendJson(res, 200, {
      total: seed.length,
      start,
      next: start + slice.length,
      done: start + slice.length >= seed.length,
      rateLimited,
      records: slice,
      notes
    });
  } catch (err) {
    return handleError(res, err);
  }
}
