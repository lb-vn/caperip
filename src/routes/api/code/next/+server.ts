import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { issueImpressionToken } from "$lib/server/impression";
import { bumpImpression, pickCode } from "$lib/server/rotation";

export const GET: RequestHandler = async ({ url, cookies }) => {
  const excludeRaw = url.searchParams.get("exclude");
  const exclude = excludeRaw ? Number(excludeRaw) : undefined;
  const validExclude = Number.isFinite(exclude) ? exclude : undefined;

  const code = await pickCode(validExclude);
  if (!code) return json({ code: null }, { status: 200 });

  await bumpImpression(code.id);
  const token = issueImpressionToken(code.id);
  cookies.set("imp_token", token, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 30,
  });

  return json({ code: { id: code.id, value: code.code } });
};
