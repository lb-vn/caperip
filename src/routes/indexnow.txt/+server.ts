import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { indexNowKey } from "$lib/server/indexnow";

export const GET: RequestHandler = () => {
  const key = indexNowKey();
  if (!key) throw error(404, "Not found");

  return new Response(key, {
    headers: {
      "content-type": "text/plain",
      "cache-control": "public, max-age=86400",
    },
  });
};
