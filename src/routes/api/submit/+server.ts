import { error, json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { codes } from "$lib/server/db/schema";
import { ipHashFor } from "$lib/server/ip";
import { isProfaneCode } from "$lib/server/profanity";
import { checkAndConsume } from "$lib/server/ratelimit";
import { verifyTurnstile } from "$lib/server/turnstile";
import { normalizeCode } from "$lib/validation";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const POST: RequestHandler = async (event) => {
  const body = (await event.request.json().catch(() => null)) as {
    code?: unknown;
    turnstileToken?: unknown;
  } | null;
  if (!body) throw error(400, "invalid body");

  const normalized = normalizeCode(body.code);
  if (!normalized) throw error(400, "invalid code format");

  const tokenOk = await verifyTurnstile(
    typeof body.turnstileToken === "string" ? body.turnstileToken : null,
  );
  if (!tokenOk) throw error(400, "captcha failed");

  const ipHash = ipHashFor(event);
  const limit = await checkAndConsume(ipHash, "submit");
  if (!limit.ok) throw error(429, `you can submit once every ${limit.window}`);

  const existing = await db.query.codes.findFirst({
    where: eq(codes.code, normalized),
  });

  if (existing) return json({ ok: true });

  await db.insert(codes).values({
    code: normalized,
    submitterIpHash: ipHash,
    expiresAt: new Date(Date.now() + WEEK_MS),
    status: isProfaneCode(normalized) ? "shadowbanned" : "active",
  });

  return json({ ok: true });
};
