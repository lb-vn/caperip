import { sql } from "drizzle-orm";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { speedReports } from "$lib/server/db/schema";
import plans from "$lib/data/plans.json";

const ORIGIN = "https://cape.rip";

const STATIC_PAGES: [path: string, priority: string, changefreq: string][] = [
  ["/", "1.0", "hourly"],
  ["/status", "0.9", "hourly"],
  ["/speeds", "0.7", "daily"],
  ["/about", "0.8", "monthly"],
  ["/compare", "0.7", "monthly"],
];

function entry(path: string, priority: string, changefreq: string): string {
  return `  <url>
    <loc>${ORIGIN}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export const GET: RequestHandler = async ({ setHeaders }) => {
  const cityStates = await db
    .selectDistinctOn([speedReports.city, speedReports.state], {
      city: speedReports.city,
      state: speedReports.state,
    })
    .from(speedReports)
    .where(sql`${speedReports.status} = 'active'`);

  const urls = [
    ...STATIC_PAGES.map((page) => entry(...page)),
    ...Object.keys(plans)
      .filter((slug) => slug !== "cape")
      .map((slug) => entry(`/compare/cape-vs-${slug}`, "0.6", "monthly")),
    ...cityStates.map(({ city, state }) =>
      entry(
        `/speeds/${city.toLowerCase().replace(/\s+/g, "-")}-${state.toLowerCase()}`,
        "0.5",
        "weekly",
      ),
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
