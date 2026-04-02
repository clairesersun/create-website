export default async function handler(req, res) {
  try {
    const { __path, ...queryParams } = req.query;
    const pathStr = __path || '/';

    const url = new URL(`https://api.search.brave.com${pathStr}`);
    for (const [key, value] of Object.entries(queryParams)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      headers: { 'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY },
    });

    const text = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
