import type { UserLocation } from "$lib/geolocation.svelte";

export type Phase =
  | "idle"
  | "info"
  | "ping"
  | "download"
  | "upload"
  | "done"
  | "error";

export interface NetworkInfo {
  asn: number | null;
  asOrganization: string | null;
  colo: string | null;
  isCape: boolean;
}

const STREAMS = 6;
const DURATION = 10000;
const WARMUP = 2000;

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function speedFromSamples(
  samples: { time: number; bytes: number }[],
  elapsed: number,
): number | null {
  const post = samples.filter((s) => s.time > WARMUP);
  if (post.length >= 2) {
    const dur = post[post.length - 1].time - post[0].time;
    if (dur >= 200) {
      let bytes = 0;
      for (let i = 1; i < post.length; i++) bytes += post[i].bytes;
      return round((bytes * 8) / (dur / 1000) / 1e6);
    }
  }
  if (samples.length > 0 && elapsed > 0) {
    let bytes = 0;
    for (const s of samples) bytes += s.bytes;
    return round((bytes * 8) / (elapsed / 1000) / 1e6);
  }
  return null;
}

function getTimeBucket(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

function detectDevice(): string {
  const ua = navigator.userAgent;
  const match =
    ua.match(/\((iPhone|iPad)[^)]*\)/) ??
    ua.match(/(Pixel \d+|SM-[A-Z]\d+|Galaxy [^;)]+)/);
  if (match) return match[1];
  if (/Android/.test(ua)) return "Android device";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  return "";
}

export function useSpeedTest(workerUrl: string) {
  let phase = $state<Phase>("idle");
  let pingMs = $state<number | null>(null);
  let downloadMbps = $state<number | null>(null);
  let uploadMbps = $state<number | null>(null);
  let progress = $state(0);
  let error = $state<string | null>(null);
  let networkInfo = $state<NetworkInfo | null>(null);
  let timeBucket = $state("");
  let device = $state("");
  let receipts = $state<string[]>([]);

  const base = workerUrl.replace(/\/$/, "");

  async function run(userLocation: UserLocation) {
    phase = "info";
    pingMs = null;
    downloadMbps = null;
    uploadMbps = null;
    progress = 0;
    error = null;
    networkInfo = null;
    receipts = [];
    timeBucket = getTimeBucket();
    device = detectDevice();

    try {
      const infoRes = await fetch(`${base}/info`);
      if (!infoRes.ok) throw new Error("Could not reach speed test server");
      const info: NetworkInfo = await infoRes.json();
      networkInfo = info;

      if (!info.isCape) {
        error = "Connect to Cape cellular data to run a speed test.";
        phase = "error";
        return;
      }

      // 20 samples, drop the first 3 as warmup, take the median
      phase = "ping";
      const pings: number[] = [];
      for (let i = 0; i < 20; i++) {
        try {
          const t0 = performance.now();
          await fetch(`${base}/ping`, { cache: "no-store" });
          pings.push(performance.now() - t0);
        } catch {
          // a dropped sample is fine, the median absorbs it
        }
        progress = (i + 1) / 20;
      }
      if (pings.length < 3) throw new Error("Could not measure latency");
      const usable = pings.length > 5 ? pings.slice(3) : pings;
      const sorted = usable.sort((a, b) => a - b);
      pingMs = Math.round(sorted[Math.floor(sorted.length / 2)]);

      phase = "download";
      progress = 0;
      downloadMbps = await measure("download");

      phase = "upload";
      progress = 0;
      uploadMbps = await measure("upload");

      phase = "done";
    } catch (e) {
      error = e instanceof Error ? e.message : "Speed test failed";
      if (phase !== "error") phase = "error";
    }
  }

  async function measure(direction: "download" | "upload"): Promise<number> {
    const samples: { time: number; bytes: number }[] = [];
    let chunkSize = 2 * 1024 * 1024;
    let running = true;
    const t0 = performance.now();

    async function stream() {
      while (running) {
        const size = chunkSize;
        let bytes: number;

        try {
          if (direction === "download") {
            const res = await fetch(`${base}/download?bytes=${size}`, {
              cache: "no-store",
            });
            if (!res.ok) throw new Error(`download ${res.status}`);
            const receipt = res.headers.get("X-Receipt");
            if (receipt) receipts = [...receipts, receipt];
            const buf = await res.arrayBuffer();
            bytes = buf.byteLength;
          } else {
            const data = new ArrayBuffer(size);
            const res = await fetch(`${base}/upload`, {
              method: "POST",
              body: data,
            });
            if (!res.ok) throw new Error(`upload ${res.status}`);
            const json = await res.json();
            if (json.receipt) receipts = [...receipts, json.receipt];
            bytes = size;
          }
        } catch {
          if (running) await new Promise((r) => setTimeout(r, 150));
          continue;
        }

        const elapsed = performance.now() - t0;
        samples.push({ time: elapsed, bytes });
        progress = Math.min(elapsed / DURATION, 1);

        const live = speedFromSamples(samples, elapsed);
        if (live !== null) {
          if (direction === "download") downloadMbps = live;
          else uploadMbps = live;

          if (live > 200) chunkSize = 16 * 1024 * 1024;
          else if (live > 100) chunkSize = 8 * 1024 * 1024;
          else if (live > 50) chunkSize = 4 * 1024 * 1024;
        }

        if (elapsed >= DURATION) break;
      }
    }

    const streams = Array.from({ length: STREAMS }, () => stream());
    const timer = new Promise<void>((resolve) => {
      setTimeout(() => {
        running = false;
        resolve();
      }, DURATION + 2000);
    });
    await Promise.race([Promise.all(streams), timer]);
    running = false;

    return speedFromSamples(samples, performance.now() - t0) ?? 0;
  }

  return {
    get phase() {
      return phase;
    },
    get pingMs() {
      return pingMs;
    },
    get downloadMbps() {
      return downloadMbps;
    },
    get uploadMbps() {
      return uploadMbps;
    },
    get progress() {
      return progress;
    },
    get error() {
      return error;
    },
    get networkInfo() {
      return networkInfo;
    },
    get timeBucket() {
      return timeBucket;
    },
    get device() {
      return device;
    },
    get receipts() {
      return receipts;
    },
    run,
  };
}
