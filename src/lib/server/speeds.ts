import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { speedReports } from "./db/schema";
import type { CityStats } from "$lib/types";
import { RECENT_MIN_REPORTS, RECENT_WINDOW_MONTHS } from "$lib/constants";

const TTL_MS = 60_000;

export const MIN_INDEXABLE_REPORTS = 5;

export const FINGERPRINT_RETENTION_DAYS = 30;

const RECENT = sql`created_at > now() - interval '${sql.raw(String(RECENT_WINDOW_MONTHS))} months'`;

let cache: { data: CityStats[]; at: number } | null = null;
let inflight: Promise<CityStats[]> | null = null;

function refresh(): Promise<CityStats[]> {
  if (inflight) return inflight;
  const run = db
    .select({
      city: speedReports.city,
      state: speedReports.state,
      count: sql<number>`count(*)::int`,
      recentCount: sql<number>`count(*) filter (where ${RECENT})::int`,
      allDown: sql<number>`round(avg(down_mbps))::int`,
      allUp: sql<number>`round(avg(up_mbps))::int`,
      allPing: sql<number>`round(avg(ping_ms))::int`,
      recentDown: sql<
        number | null
      >`round(avg(down_mbps) filter (where ${RECENT}))::int`,
      recentUp: sql<
        number | null
      >`round(avg(up_mbps) filter (where ${RECENT}))::int`,
      recentPing: sql<
        number | null
      >`round(avg(ping_ms) filter (where ${RECENT}))::int`,
      lat: sql<number | null>`avg(lat)::real`,
      lng: sql<number | null>`avg(lng)::real`,
      updatedAt: sql<string>`to_char(max(created_at) at time zone 'utc', 'YYYY-MM-DD')`,
    })
    .from(speedReports)
    .where(eq(speedReports.status, "active"))
    .groupBy(speedReports.city, speedReports.state)
    .orderBy(sql`count(*) DESC`)
    .then((rows) => {
      const data = rows.map((r) => {
        const windowed =
          r.recentCount >= RECENT_MIN_REPORTS && r.recentDown != null;
        return {
          city: r.city,
          state: r.state,
          count: r.count,
          recentCount: r.recentCount,
          windowed,
          avgDown: windowed ? r.recentDown! : r.allDown,
          avgUp: windowed ? r.recentUp! : r.allUp,
          avgPing: windowed ? r.recentPing! : r.allPing,
          lat: r.lat,
          lng: r.lng,
          updatedAt: r.updatedAt,
        };
      });
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

export async function clearOldFingerprints(): Promise<void> {
  await db.execute(
    sql`UPDATE speed_reports SET fingerprint = NULL
        WHERE fingerprint IS NOT NULL
          AND created_at < now() - interval '${sql.raw(String(FINGERPRINT_RETENTION_DAYS))} days'`,
  );
}

export async function indexableCities(): Promise<CityStats[]> {
  const cities = await topCities();
  return cities.filter((c) => c.count >= MIN_INDEXABLE_REPORTS);
}
