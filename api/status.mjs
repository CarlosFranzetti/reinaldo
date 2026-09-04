export default function handler(req, res) {
  res.status(200).setHeader('Cache-Control', 'no-store').json({
    ok: true,
    tokenConfigured: Boolean(process.env.DISCOGS_TOKEN)
  });
}
