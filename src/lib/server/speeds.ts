import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { speedReports } from "./db/schema";
import type { CityStats } from "$lib/types";

const TTL_MS = 60_000;

let cache: { data: CityStats[]; at: number } | null = null;
let inflight: Promise<CityStats[]> | null = null;

function refresh(): Promise<CityStats[]> {
  if (inflight) return inflight;
  const run = db
    .select({
      city: speedReports.city,
      state: speedReports.state,
      count: sql<number>`count(*)::int`,
      avgDown: sql<number>`round(avg(down_mbps))::int`,
      avgUp: sql<number>`round(avg(up_mbps))::int`,
      avgPing: sql<number>`round(avg(ping_ms))::int`,
      lat: sql<number | null>`avg(lat)::real`,
      lng: sql<number | null>`avg(lng)::real`,
    })
    .from(speedReports)
    .where(eq(speedReports.status, "active"))
    .groupBy(speedReports.city, speedReports.state)
    .orderBy(sql`count(*) DESC`)
    .then((data) => {
      cache = { data, at: Date.now() };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  inflight = run;
  return run;
}

export async function topCities(): Promise<CityStats[]> {
  if (!cache) return refresh();
  if (Date.now() - cache.at >= TTL_MS) refresh().catch(() => {});
  return cache.data;
}
