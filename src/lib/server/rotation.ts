import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "./db";
import { codes } from "./db/schema";
import type { Code } from "./db/schema";

const ACTIVE = and(eq(codes.status, "active"), sql`${codes.expiresAt} > now()`);

const IMPRESSION_CAP = 10;
const REPORT_CAP = 10;
const CLAIM_CAP = 5;

export async function pickCode(excludeId?: number): Promise<Code | null> {
  const rows = await db
    .select()
    .from(codes)
    .where(
      excludeId == null
        ? ACTIVE
        : and(ACTIVE, sql`${codes.id} <> ${excludeId}`),
    )
    .orderBy(
      sql`-ln(random())
        * (LEAST(${codes.impressions}, ${IMPRESSION_CAP}) + 1)
        * (LEAST(${codes.reportCount}, ${REPORT_CAP}) + 1)
        * (LEAST(${codes.claimedCount}, ${CLAIM_CAP}) + 1)`,
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function activeCodeCount(): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(codes)
    .where(ACTIVE);
  return rows[0]?.count ?? 0;
}

export async function bumpImpression(codeId: number): Promise<void> {
  await db
    .update(codes)
    .set({ impressions: sql`${codes.impressions} + 1` })
    .where(eq(codes.id, codeId));
}

export async function bumpClaim(codeId: number): Promise<void> {
  await db
    .update(codes)
    .set({ claimedCount: sql`${codes.claimedCount} + 1` })
    .where(eq(codes.id, codeId));
}

export async function sweepExpired(): Promise<void> {
  await db.delete(codes).where(lt(codes.expiresAt, sql`now()`));
}
