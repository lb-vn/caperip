import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "./db";
import { rateEvents } from "./db/schema";

export type Action = "submit" | "report" | "geocode";

const WINDOWS: Record<Action, { ms: number; max: number; label: string }> = {
  submit: { ms: 24 * 60 * 60 * 1000, max: 1, label: "24 hours" },
  report: { ms: 7 * 24 * 60 * 60 * 1000, max: 3, label: "7 days" },
  geocode: { ms: 60 * 60 * 1000, max: 12, label: "hour" },
};

export type RateLimit =
  | { ok: true }
  | { ok: false; retryAfterSec: number; limit: number; window: string };

export async function checkAndConsume(
  ipHash: string,
  action: Action,
): Promise<RateLimit> {
  const { ms, max, label } = WINDOWS[action];
  const since = new Date(Date.now() - ms);

  const rows = await db
    .select({ createdAt: rateEvents.createdAt })
    .from(rateEvents)
    .where(
      and(
        eq(rateEvents.ipHash, ipHash),
        eq(rateEvents.action, action),
        gte(rateEvents.createdAt, since),
      ),
    );

  if (rows.length >= max) {
    const oldest = Math.min(...rows.map((r) => r.createdAt.getTime()));
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((oldest + ms - Date.now()) / 1000)),
      limit: max,
      window: label,
    };
  }

  await db.insert(rateEvents).values({ ipHash, action });
  return { ok: true };
}

export async function pruneRateEvents(): Promise<void> {
  await db.execute(
    sql`DELETE FROM rate_events WHERE created_at < now() - interval '7 days'`,
  );
}
