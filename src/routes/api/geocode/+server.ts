import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { ipHashFor } from "$lib/server/ip";
import { checkAndConsume } from "$lib/server/ratelimit";

const NOMINATIM = "https://nominatim.openstreetmap.org/reverse";

const UA = "cape.rip/1.0 (+https://cape.rip)";

interface Resolved {
  city: string | null;
  state: string | null;
  postcode: string | null;
}

const cache = new Map<string, Resolved>();
const CACHE_MAX = 500;

// ~110m: enough to resolve city/state/ZIP
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export const POST: RequestHandler = async (event) => {
  const body = (await event.request.json().catch(() => null)) as {
    lat?: unknown;
    lng?: unknown;
  } | null;

  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw error(400, "lat and lng are required");
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw error(400, "coordinates out of range");
  }

  const rlat = round3(lat);
  const rlng = round3(lng);
  const key = `${rlat},${rlng}`;

  const hit = cache.get(key);
  if (hit) return json(hit);

  const limit = await checkAndConsume(ipHashFor(event), "geocode");
  if (!limit.ok) throw error(429, "too many location lookups, try later");

  let resolved: Resolved = { city: null, state: null, postcode: null };
  try {
    const res = await fetch(
      `${NOMINATIM}?lat=${rlat}&lon=${rlng}&format=json`,
      {
        headers: { "User-Agent": UA, "Accept-Language": "en" },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (res.ok) {
      const data = (await res.json()) as {
        address?: Record<string, string>;
      };
      const addr = data.address ?? {};
      resolved = {
        city: addr.city ?? addr.town ?? addr.village ?? addr.county ?? null,
        state: addr["ISO3166-2-lvl4"]?.split("-")[1] ?? null,
        postcode: addr.postcode ?? null,
      };
    }
  } catch {
    // network error or timeout: fall through with nulls, do not cache
  }

  if (resolved.city || resolved.postcode) {
    if (cache.size >= CACHE_MAX) cache.clear();
    cache.set(key, resolved);
  }

  return json(resolved);
};
