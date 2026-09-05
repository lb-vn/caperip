import type { RequestHandler } from "./$types";
import { citySlug } from "$lib/slug";
import { indexableCities } from "$lib/server/speeds";
import plans from "$lib/data/plans.json";

const ORIGIN = "https://cape.rip";

const STATIC_PAGES = [
  "/",
  "/referral-codes",
  "/status",
  "/speeds",
  "/about",
  "/compare",
];

function entry(path: string, lastmod?: string): string {
  const modified = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  return `  <url>
    <loc>${ORIGIN}${path}</loc>${modified}
  </url>`;
}

export const GET: RequestHandler = async ({ setHeaders }) => {
  const cities = await indexableCities().catch(() => []);
  const latest = cities
    .map((c) => c.updatedAt)
    .sort()
    .at(-1);

  const urls = [
    ...STATIC_PAGES.map((path) =>
      entry(path, path === "/speeds" ? latest : undefined),
    ),
    ...Object.keys(plans)
      .filter((slug) => slug !== "cape")
      .map((slug) => entry(`/compare/cape-vs-${slug}`)),
    ...cities.map((c) =>
      entry(`/speeds/${citySlug(c.city, c.state)}`, c.updatedAt),
    ),
  ];

  setHeaders({
    "content-type": "application/xml",
    "cache-control": "public, max-age=3600",
  });
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`,
  );
};
