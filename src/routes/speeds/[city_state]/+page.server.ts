import { error } from "@sveltejs/kit";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "$lib/server/db";
import { speedReports } from "$lib/server/db/schema";
import { MIN_INDEXABLE_REPORTS, topCities } from "$lib/server/speeds";
import { RECENT_MIN_REPORTS, RECENT_WINDOW_MONTHS } from "$lib/constants";

const RECENT = sql`created_at > now() - interval '${sql.raw(String(RECENT_WINDOW_MONTHS))} months'`;
import type { PageServerLoad } from "./$types";

function titleCase(str: string): string {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export const load: PageServerLoad = async ({ params }) => {
  const slug = params.city_state;
  const lastDash = slug.lastIndexOf("-");
  if (lastDash < 1) throw error(404, "Not found");

  const rawCity = slug.slice(0, lastDash).replace(/-/g, " ");
  const rawState = slug.slice(lastDash + 1);

  if (rawState.length !== 2) throw error(404, "Not found");

  const city = titleCase(rawCity);
  const state = rawState.toUpperCase();

  const condition = and(
    eq(speedReports.city, city),
    eq(speedReports.state, state),
    eq(speedReports.status, "active"),
  );

  const statsRows = await db
    .select({
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
    })
    .from(speedReports)
    .where(condition);

  const raw = statsRows[0];
  if (raw.count === 0) throw error(404, "No speed reports found for this city");

  const windowed =
    raw.recentCount >= RECENT_MIN_REPORTS && raw.recentDown != null;
  const stats = {
    count: raw.count,
    recentCount: raw.recentCount,
    windowed,
    avgDown: windowed ? raw.recentDown! : raw.allDown,
    avgUp: windowed ? raw.recentUp! : raw.allUp,
    avgPing: windowed ? raw.recentPing! : raw.allPing,
  };

  const scope = windowed ? and(condition, RECENT) : condition;

  const [reports, byTime, byDay, byWeekday, byDevice] = await Promise.all([
    db
      .select({
        id: speedReports.id,
        downMbps: speedReports.downMbps,
        upMbps: speedReports.upMbps,
        pingMs: speedReports.pingMs,
        timeBucket: speedReports.timeBucket,
        device: speedReports.device,
        createdAt: speedReports.createdAt,
      })
      .from(speedReports)
      .where(condition)
      .orderBy(desc(speedReports.createdAt))
      .limit(20),
    db
      .select({
        timeBucket: speedReports.timeBucket,
        avgDown: sql<number>`round(avg(down_mbps)::numeric, 1)`,
        avgUp: sql<number>`round(avg(up_mbps)::numeric, 1)`,
        avgPing: sql<number>`round(avg(ping_ms))::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(speedReports)
      .where(scope)
      .groupBy(speedReports.timeBucket),
    db
      .select({
        day: sql<string>`to_char(created_at::date, 'YYYY-MM-DD')`,
        avgDown: sql<number>`round(avg(down_mbps)::numeric, 1)`,
        avgUp: sql<number>`round(avg(up_mbps)::numeric, 1)`,
        count: sql<number>`count(*)::int`,
      })
      .from(speedReports)
      .where(and(condition, sql`created_at > now() - interval '30 days'`))
      .groupBy(sql`created_at::date`)
      .orderBy(sql`created_at::date`),
    db
      .select({
        weekday: sql<number>`extract(dow from created_at)::int`,
        avgDown: sql<number>`round(avg(down_mbps)::numeric, 1)`,
        avgUp: sql<number>`round(avg(up_mbps)::numeric, 1)`,
        count: sql<number>`count(*)::int`,
      })
      .from(speedReports)
      .where(scope)
      .groupBy(sql`extract(dow from created_at)::int`)
      .orderBy(sql`extract(dow from created_at)::int`),
    db
      .select({
        device: sql<string>`coalesce(nullif(device, ''), 'Unknown')`,
        count: sql<number>`count(*)::int`,
        avgDown: sql<number>`round(avg(down_mbps)::numeric, 1)`,
      })
      .from(speedReports)
      .where(scope)
      .groupBy(sql`coalesce(nullif(device, ''), 'Unknown')`)
      .orderBy(sql`count(*) desc`),
  ]);

  if (reports.length === 0)
    throw error(404, "No speed reports found for this city");

  const timeOrder = ["morning", "afternoon", "evening", "night"];
  const sortedByTime = timeOrder
    .map((t) => byTime.find((r) => r.timeBucket === t))
    .filter((r): r is NonNullable<typeof r> => r != null);

  const nearby = (await topCities().catch(() => []))
    .filter((c) => c.state === state && c.city !== city)
    .slice(0, 6);

  return {
    city,
    state,
    indexable: stats.count >= MIN_INDEXABLE_REPORTS,
    nearby,
    reports: reports.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    stats,
    byTime: sortedByTime,
    byDay,
    byWeekday,
    byDevice,
  };
};
