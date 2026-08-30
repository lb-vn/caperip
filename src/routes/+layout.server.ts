import { env as publicEnv } from "$env/dynamic/public";
import { footerStatus } from "$lib/server/status";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = () => ({
  turnstileSiteKey: publicEnv.PUBLIC_TURNSTILE_SITE_KEY ?? "",
  speedtestUrl: publicEnv.PUBLIC_SPEEDTEST_URL ?? "",
  footerStatus: footerStatus(),
});
