interface Env {
  CAPE_ASNS: string;
  ALLOWED_ORIGINS: string;
  RECEIPT_SECRET: string;
}

interface CfProperties {
  asn?: number;
  asOrganization?: string;
  city?: string;
  region?: string;
  regionCode?: string;
  postalCode?: string;
  latitude?: string;
  longitude?: string;
  country?: string;
  colo?: string;
}

interface Receipt {
  d: "download" | "upload";
  b: number;
  t: number;
}

const MAX_DOWNLOAD = 25 * 1024 * 1024;
const MAX_UPLOAD = 25 * 1024 * 1024;
const CHUNK = 65536;
const RECEIPT_MAX_AGE_MS = 300_000;
const WARMUP_MS = 2000;

function cors(origin: string, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin)
      ? origin
      : allowed[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Expose-Headers": "X-Receipt",
    "Access-Control-Max-Age": "86400",
  };
}

function getCf(request: Request): CfProperties {
  return (request as unknown as { cf?: CfProperties }).cf ?? {};
}

function isCape(request: Request, env: Env): boolean {
  const asn = String(getCf(request).asn ?? "");
  const capeAsns = env.CAPE_ASNS.split(",").map((s) => s.trim());
  return capeAsns.includes(asn);
}

async function signReceipt(receipt: Receipt, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const payload = `${receipt.d}:${receipt.b}:${receipt.t}`;
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const hex = [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${payload}:${hex}`;
}

async function verifyReceipt(
  token: string,
  secret: string,
): Promise<Receipt | null> {
  const lastColon = token.lastIndexOf(":");
  if (lastColon < 0) return null;
  const payload = token.slice(0, lastColon);
  const sig = token.slice(lastColon + 1);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigBytes = new Uint8Array(
    sig.match(/.{2}/g)!.map((b) => parseInt(b, 16)),
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    new TextEncoder().encode(payload),
  );
  if (!valid) return null;

  const parts = payload.split(":");
  if (parts.length !== 3) return null;
  const d = parts[0] as "download" | "upload";
  if (d !== "download" && d !== "upload") return null;
  return { d, b: parseInt(parts[1]), t: parseInt(parts[2]) };
}

function computeSpeed(
  receipts: Receipt[],
  direction: "download" | "upload",
): number {
  const filtered = receipts
    .filter((r) => r.d === direction)
    .sort((a, b) => a.t - b.t);
  if (filtered.length < 2) return 0;

  const t0 = filtered[0].t;
  const postWarmup = filtered.filter((r) => r.t - t0 > WARMUP_MS);

  const src = postWarmup.length >= 2 ? postWarmup : filtered;
  const durationMs = src[src.length - 1].t - src[0].t;
  if (durationMs < 100) return 0;

  // only bytes that completed inside the window count
  let windowBytes = 0;
  for (let i = 1; i < src.length; i++) windowBytes += src[i].b;

  return Math.round(((windowBytes * 8) / (durationMs / 1000) / 1e6) * 10) / 10;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? "";
    const headers = cors(origin, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    const path = url.pathname;

    if (path === "/info") {
      const cf = getCf(request);
      return Response.json(
        {
          asn: cf.asn ?? null,
          asOrganization: cf.asOrganization ?? null,
          colo: cf.colo ?? null,
          isCape: isCape(request, env),
        },
        { headers },
      );
    }

    if (path === "/verify" && request.method === "POST") {
      const body = (await request.json().catch(() => null)) as {
        receipts?: string[];
      } | null;
      if (!body?.receipts || !Array.isArray(body.receipts)) {
        return Response.json(
          { error: "receipts required" },
          { status: 400, headers },
        );
      }

      if (body.receipts.length > 500) {
        return Response.json(
          { error: "too many receipts" },
          { status: 400, headers },
        );
      }

      const verified: Receipt[] = [];
      const now = Date.now();

      for (const token of body.receipts) {
        if (typeof token !== "string") continue;
        const r = await verifyReceipt(token, env.RECEIPT_SECRET);
        if (!r) continue;
        if (now - r.t > RECEIPT_MAX_AGE_MS) continue;
        verified.push(r);
      }

      if (verified.length < 2) {
        return Response.json(
          { error: "not enough valid receipts" },
          { status: 400, headers },
        );
      }

      const downMbps = computeSpeed(verified, "download");
      const upMbps = computeSpeed(verified, "upload");

      return Response.json(
        { downMbps, upMbps, receiptCount: verified.length },
        { headers },
      );
    }

    if (!isCape(request, env)) {
      return Response.json(
        { error: "not on Cape network" },
        { status: 403, headers },
      );
    }

    if (path === "/ping") {
      return new Response(null, {
        status: 204,
        headers: { ...headers, "Cache-Control": "no-store" },
      });
    }

    if (path === "/download" && request.method === "GET") {
      const bytes = Math.min(
        parseInt(url.searchParams.get("bytes") ?? "1048576") || 1048576,
        MAX_DOWNLOAD,
      );
      let remaining = bytes;

      const stream = new ReadableStream({
        pull(controller) {
          if (remaining <= 0) {
            controller.close();
            return;
          }
          const size = Math.min(CHUNK, remaining);
          controller.enqueue(new Uint8Array(size));
          remaining -= size;
        },
      });

      const receipt: Receipt = { d: "download", b: bytes, t: Date.now() };
      const token = await signReceipt(receipt, env.RECEIPT_SECRET);

      return new Response(stream, {
        headers: {
          ...headers,
          "Content-Type": "application/octet-stream",
          "Content-Length": String(bytes),
          "Cache-Control": "no-store",
          "X-Receipt": token,
        },
      });
    }

    if (path === "/upload" && request.method === "POST") {
      let total = 0;
      if (request.body) {
        const reader = request.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          total += value.byteLength;
          if (total > MAX_UPLOAD) break;
        }
      }

      const receipt: Receipt = { d: "upload", b: total, t: Date.now() };
      const token = await signReceipt(receipt, env.RECEIPT_SECRET);

      return Response.json(
        { bytes: total, receipt: token },
        { headers: { ...headers, "Cache-Control": "no-store" } },
      );
    }

    return new Response("not found", { status: 404, headers });
  },
} satisfies ExportedHandler<Env>;
