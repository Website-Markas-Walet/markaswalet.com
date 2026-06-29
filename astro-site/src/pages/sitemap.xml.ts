import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://markaswalet.com';

export const GET: APIRoute = async () => {
  const articles = (await getCollection('articles')).filter(
    (a) => a.data.title && !/^\d+$/.test(a.slug)
  );

  const urls = [
    { loc: `${SITE}/`, },
    { loc: `${SITE}/article/`, },
    ...articles.map((a) => ({
      loc: `${SITE}/article/${a.slug}/`,
      lastmod: a.data.pubDate || undefined,
    })),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url><loc>${u.loc}</loc>${'lastmod' in u && u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`
      )
      .join('\n') +
    `\n</urlset>\n`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
