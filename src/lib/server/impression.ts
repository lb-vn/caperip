import { env } from "$env/dynamic/private";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TTL_MS = 30 * 60 * 1000;

function sign(payload: string): string {
  const secret = env.COOKIE_SECRET;
  if (!secret) throw new Error("COOKIE_SECRET is required");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

// stateless proof that this code was served to this session, so a report can only target a code the reporter was actually shown
export function issueImpressionToken(codeId: number): string {
  const payload = `${codeId}.${Date.now()}.${randomBytes(8).toString("hex")}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyImpressionToken(
  token: string | undefined,
  expectedCodeId: number,
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;

  const [codeId, issuedAtStr, nonce, providedSig] = parts;
  if (Number(codeId) !== expectedCodeId) return false;

  const issuedAt = Number(issuedAtStr);
  const age = Date.now() - issuedAt;
  if (!Number.isFinite(issuedAt) || age > TTL_MS || age < -60_000) return false;

  const expected = sign(`${codeId}.${issuedAtStr}.${nonce}`);
  if (expected.length !== providedSig.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(providedSig));
}
