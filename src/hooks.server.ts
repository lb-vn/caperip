import type { Handle } from "@sveltejs/kit";
import { startCleanupLoop } from "$lib/server/cleanup";
import { bootstrapSchema } from "$lib/server/db/bootstrap";
import { startStatusRefresh } from "$lib/server/status";

let ready: Promise<void> | null = null;

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
  return resolve(event);
};
