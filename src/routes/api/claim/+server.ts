import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { verifyImpressionToken } from "$lib/server/impression";
import { bumpClaim } from "$lib/server/rotation";

export const POST: RequestHandler = async (event) => {
  const body = (await event.request.json().catch(() => null)) as {
    codeId?: unknown;
  } | null;
  const codeId = Number(body?.codeId);
  if (!Number.isFinite(codeId)) return json({ ok: false }, { status: 400 });

  const token = event.cookies.get("imp_token");
  if (!verifyImpressionToken(token, codeId)) {
    return json({ ok: true });
  }

  await bumpClaim(codeId);
  return json({ ok: true });
};
