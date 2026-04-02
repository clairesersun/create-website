export default async function handler(req, res) {
  try {
    const pathSegments = req.query.path || [];
    const pathStr = '/' + pathSegments.join('/');

    const queryParams = { ...req.query };
    delete queryParams.path;

    const url = new URL(`https://maps.googleapis.com${pathStr}`);
    for (const [key, value] of Object.entries(queryParams)) {
      url.searchParams.set(key, value);
    }
    url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('image')) {
      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.status(200).send(buffer);
    } else {
      const text = await response.text();
      res.setHeader('Content-Type', contentType);
      res.status(response.status).send(text);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
