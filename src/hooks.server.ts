import type { Handle } from "@sveltejs/kit";
import { startCleanupLoop } from "$lib/server/cleanup";
import { bootstrapSchema } from "$lib/server/db/bootstrap";
import { startStatusRefresh } from "$lib/server/status";

let ready: Promise<void> | null = null;

const CACHEABLE = /^\/(about|referral-codes|compare|speeds\/.)/;

async function boot(): Promise<void> {
  await bootstrapSchema();
  startCleanupLoop();
  startStatusRefresh();
}

export const handle: Handle = async ({ event, resolve }) => {
  if (!ready) {
    ready = boot().catch((err) => {
      ready = null;
      throw err;
    });
  }
  await ready;

  const response = await resolve(event);

  response.headers.set(
    "strict-transport-security",
    "max-age=31536000; includeSubDomains",
  );

  if (event.request.method === "GET" && CACHEABLE.test(event.url.pathname)) {
    response.headers.set(
      "cache-control",
      "public, max-age=60, stale-while-revalidate=3600",
    );
  }

  return response;
};
