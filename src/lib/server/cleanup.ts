import { pruneRateEvents } from "./ratelimit";
import { sweepExpired } from "./rotation";

const INTERVAL_MS = 15 * 60 * 1000;

let timer: NodeJS.Timeout | null = null;

export function startCleanupLoop(): void {
  if (timer) return;
  const run = () =>
    Promise.all([sweepExpired(), pruneRateEvents()]).catch((err) =>
      console.error("[cleanup]", err),
    );
  timer = setInterval(run, INTERVAL_MS);
  timer.unref?.();
  setTimeout(run, 5_000).unref?.();
}
