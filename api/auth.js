export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    // No password configured — allow access (local dev)
    return res.status(200).json({ ok: true });
  }

  if (password === sitePassword) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false });
}
