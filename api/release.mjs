import { discogsFetch, handleError, sendJson } from './_lib/discogs.mjs';

export default async function handler(req, res) {
  try {
    const id = String(req.query?.id || '').trim();
    if (!/^\d+$/.test(id)) return sendJson(res, 400, { error: 'Invalid release id.' });
    const r = await discogsFetch(`/releases/${id}`);
    return sendJson(res, 200, {
      id: r.id,
      title: r.title || '',
      artists: (r.artists || []).map(a => a.anv || a.name).filter(Boolean).join(', '),
      year: r.year || '',
      country: r.country || '',
      labels: (r.labels || []).map(l => ({ name: l.name, catno: l.catno })),
      formats: r.formats || [],
      genres: r.genres || [],
      styles: r.styles || [],
      tracklist: (r.tracklist || []).map(t => ({ position: t.position || '', title: t.title || '', duration: t.duration || '' })),
      uri: r.uri || '',
      images: (r.images || []).slice(0, 3).map(i => ({ uri: i.uri, uri150: i.uri150 }))
    });
  } catch (err) {
    return handleError(res, err);
  }
}
