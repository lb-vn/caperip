import { getStatus } from "$lib/server/status";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ setHeaders }) => {
  setHeaders({
    "cache-control":
      "public, max-age=60, s-maxage=60, stale-while-revalidate=600",
  });
  return { status: await getStatus() };
};
