import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = __dirname;
const USER_AGENT = 'ReysForSell/1.0 +local-app';

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function discogsFetch(pathname, token) {
  if (!token) throw Object.assign(new Error('Set DISCOGS_TOKEN before using Discogs lookup.'), { status: 503 });
  const response = await fetch(`https://api.discogs.com${pathname}`, {
    headers: {
      Authorization: `Discogs token=${token}`,
      'User-Agent': USER_AGENT,
      Accept: 'application/json'
    }
  });
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }
  if (!response.ok) {
    const err = new Error(body.message || `Discogs returned ${response.status}`);
    err.status = response.status;
    err.details = body;
    throw err;
  }
  return body;
}

const STATIC_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function mimeFor(file) {
  return STATIC_TYPES[path.extname(file).toLowerCase()];
}

async function serveStatic(req, res) {
  const requestPath = new URL(req.url, 'http://localhost').pathname;
  const relative = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const root = path.resolve(publicDir);
  const filePath = path.resolve(root, relative);
  const contentType = mimeFor(filePath);
  // Static assets sit next to the server sources here, so only known asset
  // types are served and dotfiles (.env) are always refused.
  const isHidden = path.relative(root, filePath).split(path.sep).some(part => part.startsWith('.'));
  if (!filePath.startsWith(root + path.sep) || isHidden || !contentType) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}

export function createServer({ token = process.env.DISCOGS_TOKEN || '' } = {}) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname === '/api/status') return json(res, 200, { ok: true, tokenConfigured: Boolean(token) });
      if (url.pathname === '/api/search') {
        const q = url.searchParams.get('q')?.trim();
        if (!q) return json(res, 400, { error: 'Search query is required.' });
        const data = await discogsFetch(`/database/search?type=release&per_page=12&q=${encodeURIComponent(q)}`, token);
        return json(res, 200, { results: (data.results || []).map(r => ({
          id: r.id, title: r.title, year: r.year || '', country: r.country || '', label: r.label?.[0] || '', catno: r.catno || '', format: r.format?.join(', ') || '', thumb: r.thumb || '', uri: r.uri || ''
        })) });
      }
      if (url.pathname.startsWith('/api/release/')) {
        const id = url.pathname.split('/').pop();
        if (!/^\d+$/.test(id)) return json(res, 400, { error: 'Invalid release id.' });
        const r = await discogsFetch(`/releases/${id}`, token);
        return json(res, 200, {
          id: r.id,
          title: r.title || '',
          artists: (r.artists || []).map(a => a.name).join(', '),
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
      }
      if (url.pathname.startsWith('/api/marketplace/')) {
        const id = url.pathname.split('/').pop();
        if (!/^\d+$/.test(id)) return json(res, 400, { error: 'Invalid release id.' });
        try {
          const m = await discogsFetch(`/marketplace/stats/${id}`, token);
          return json(res, 200, {
            available: true,
            numForSale: m.num_for_sale ?? null,
            lowestPrice: m.lowest_price ? { value: m.lowest_price.value, currency: m.lowest_price.currency } : null,
            blockedFromSale: m.blocked_from_sale ?? null
          });
        } catch (err) {
          if ([401,403,404].includes(err.status)) return json(res, 200, { available: false, reason: err.message, status: err.status });
          throw err;
        }
      }
      return serveStatic(req, res);
    } catch (err) {
      json(res, err.status || 500, { error: err.message || 'Server error' });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  const server = createServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`Vinyl Collector running at http://127.0.0.1:${port}`);
    console.log(process.env.DISCOGS_TOKEN ? 'Discogs token configured.' : 'Discogs token NOT configured. Set DISCOGS_TOKEN to enable lookup.');
  });
}
