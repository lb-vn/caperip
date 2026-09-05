import { env as publicEnv } from "$env/dynamic/public";
import { issueImpressionToken } from "$lib/server/impression";
import { bumpImpression, pickCode, poolStats } from "$lib/server/rotation";
import { topCities } from "$lib/server/speeds";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ cookies }) => {
  const pool = await Promise.all([pickCode(), poolStats()]).catch((err) => {
    console.error("[codes]", err);
    return null;
  });
  const speedCities = await topCities().catch(() => []);
  const [code, stats] = pool ?? [null, { count: 0, updatedAt: null }];

  if (code) {
    await bumpImpression(code.id).catch(() => {});
    cookies.set("imp_token", issueImpressionToken(code.id), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 30,
    });
  }

  return {
    initial: code && { id: code.id, value: code.code },
    activeCount: stats.count,
    poolUpdatedAt: stats.updatedAt,
    speedCities,
    poolAvailable: pool !== null,
    turnstileSiteKey: publicEnv.PUBLIC_TURNSTILE_SITE_KEY ?? "",
  };
};
