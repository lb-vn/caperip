import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { indexNowKey } from "$lib/server/indexnow";

export const GET: RequestHandler = ({ params }) => {
  const key = indexNowKey();
  if (!key || params.key !== key) throw error(404, "Not found");

  return new Response(key, {
    headers: {
      "content-type": "text/plain",
      "cache-control": "public, max-age=86400",
    },
  });
};
