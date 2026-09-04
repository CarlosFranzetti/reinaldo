import { discogsFetch, handleError, sendJson } from './_lib/discogs.mjs';

export default async function handler(req, res) {
  try {
    const q = String(req.query?.q || '').trim();
    if (!q) return sendJson(res, 400, { error: 'Search query is required.' });
    const data = await discogsFetch(`/database/search?type=release&per_page=12&q=${encodeURIComponent(q)}`);
    return sendJson(res, 200, {
      results: (data.results || []).map(r => ({
        id: r.id,
        title: r.title,
        year: r.year || '',
        country: r.country || '',
        label: r.label?.[0] || '',
        catno: r.catno || '',
        format: r.format?.join(', ') || '',
        thumb: r.thumb || '',
        uri: r.uri || ''
      }))
    });
  } catch (err) {
    return handleError(res, err);
  }
}
