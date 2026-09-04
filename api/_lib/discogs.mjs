const USER_AGENT = 'ReysForSell/1.1 +vercel-app';

export function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').setHeader('Cache-Control', 'no-store').json(body);
}

export async function discogsFetch(pathname) {
  const token = process.env.DISCOGS_TOKEN || '';
  if (!token) {
    const err = new Error('DISCOGS_TOKEN is not configured on the server.');
    err.status = 503;
    throw err;
  }
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

export function handleError(res, err) {
  return sendJson(res, err.status || 500, { error: err.message || 'Server error' });
}
