import { error, json } from "@sveltejs/kit";
import { eq, sql } from "drizzle-orm";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { codes, reports } from "$lib/server/db/schema";
import { verifyImpressionToken } from "$lib/server/impression";
import { ipHashFor } from "$lib/server/ip";
import { checkAndConsume } from "$lib/server/ratelimit";

export const POST: RequestHandler = async (event) => {
  const body = (await event.request.json().catch(() => null)) as {
    codeId?: unknown;
  } | null;
  const codeId = Number(body?.codeId);
  if (!Number.isFinite(codeId)) throw error(400, "invalid body");

  if (!verifyImpressionToken(event.cookies.get("imp_token"), codeId)) {
    throw error(403, "this code was not served to your session");
  }

  const ipHash = ipHashFor(event);
  const limit = await checkAndConsume(ipHash, "report");
  if (!limit.ok) {
    throw error(
      429,
      `you can only report ${limit.limit} codes per ${limit.window}`,
    );
  }

  try {
    await db.insert(reports).values({ codeId, ipHash });
    await db
      .update(codes)
      .set({ reportCount: sql`${codes.reportCount} + 1` })
      .where(eq(codes.id, codeId));
  } catch {}

  event.cookies.delete("imp_token", { path: "/" });
  return json({ ok: true });
};
