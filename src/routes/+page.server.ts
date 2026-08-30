import { env as publicEnv } from "$env/dynamic/public";
import { issueImpressionToken } from "$lib/server/impression";
import {
  activeCodeCount,
  bumpImpression,
  pickCode,
} from "$lib/server/rotation";
import { topCities } from "$lib/server/speeds";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ cookies }) => {
  const pool = await Promise.all([pickCode(), activeCodeCount()]).catch(
    (err) => {
      console.error("[codes]", err);
      return null;
    },
  );
  const speedCities = await topCities().catch(() => []);
  const [code, activeCount] = pool ?? [null, 0];

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
    activeCount,
    speedCities,
    poolAvailable: pool !== null,
    turnstileSiteKey: publicEnv.PUBLIC_TURNSTILE_SITE_KEY ?? "",
  };
};
