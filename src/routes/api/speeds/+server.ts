import { error, json } from "@sveltejs/kit";
import { env as publicEnv } from "$env/dynamic/public";
import { sql } from "drizzle-orm";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { speedReports } from "$lib/server/db/schema";
import { ipHashFor } from "$lib/server/ip";
import { verifyTurnstile } from "$lib/server/turnstile";

const TIME_BUCKETS = ["morning", "afternoon", "evening", "night"];
const MAX_DOWN_MBPS = 500;
const MAX_UP_MBPS = 200;
const MAX_PING_MS = 5000;

function titleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function coord(v: unknown): number | null {
  return typeof v === "number" && isFinite(v)
    ? Math.round(v * 100) / 100
    : null;
}

export const POST: RequestHandler = async (event) => {
  const body = (await event.request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) throw error(400, "invalid body");

  const zip = typeof body.zip === "string" ? body.zip.trim() : "";
  if (!/^\d{5}$/.test(zip)) throw error(400, "ZIP must be 5 digits");

  const city = typeof body.city === "string" ? body.city.trim() : "";
  if (!city) throw error(400, "city is required");

  const state =
    typeof body.state === "string" ? body.state.trim().toUpperCase() : "";
  if (!/^[A-Z]{2}$/.test(state)) throw error(400, "state must be 2 letters");

  // ping stays client-reported, the worker can't measure round-trip latency
  const pingMs = Number(body.pingMs);
  if (!(pingMs > 0)) throw error(400, "ping must be a positive number");
  if (pingMs > MAX_PING_MS) throw error(400, "ping value out of range");

  const timeBucket = typeof body.timeBucket === "string" ? body.timeBucket : "";
  if (!TIME_BUCKETS.includes(timeBucket)) {
    throw error(400, `time bucket must be one of ${TIME_BUCKETS.join(", ")}`);
  }

  const receipts = (Array.isArray(body.receipts) ? body.receipts : []).filter(
    (r): r is string => typeof r === "string",
  );
  if (receipts.length < 2) throw error(400, "not enough valid receipts");

  // speeds come from the worker's signed receipts
  const workerUrl = (publicEnv.PUBLIC_SPEEDTEST_URL ?? "").replace(/\/$/, "");
  if (!workerUrl) throw error(500, "speed test worker not configured");

  const verifyRes = await fetch(`${workerUrl}/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ receipts }),
  });
  if (!verifyRes.ok) {
    const msg = await verifyRes.text().catch(() => "verification failed");
    throw error(400, `receipt verification failed: ${msg}`);
  }

  const { downMbps, upMbps } = (await verifyRes.json()) as {
    downMbps: number;
    upMbps: number;
  };
  if (!downMbps || !upMbps) throw error(400, "could not compute speeds");
  if (downMbps > MAX_DOWN_MBPS || upMbps > MAX_UP_MBPS) {
    throw error(400, "verified speeds out of range");
  }

  const tokenOk = await verifyTurnstile(
    typeof body.turnstileToken === "string" ? body.turnstileToken : null,
  );
  if (!tokenOk) throw error(400, "captcha failed");

  const fingerprint = ipHashFor(event);
  const recent = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(speedReports)
    .where(
      sql`${speedReports.fingerprint} = ${fingerprint} AND ${speedReports.createdAt} > now() - interval '1 hour'`,
    );
  if (recent[0].count > 0) throw error(429, "one speed report per hour");

  await db.insert(speedReports).values({
    zip,
    city: titleCase(city),
    state,
    downMbps,
    upMbps,
    pingMs,
    timeBucket,
    device:
      typeof body.device === "string" && body.device.trim()
        ? body.device.trim()
        : null,
    lat: coord(body.lat),
    lng: coord(body.lng),
    fingerprint,
    status: "active",
  });

  return json({ ok: true, downMbps, upMbps });
};
