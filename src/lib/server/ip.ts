import { env } from "$env/dynamic/private";
import { error } from "@sveltejs/kit";
import { createHmac } from "node:crypto";
import type { RequestEvent } from "@sveltejs/kit";

export function ipHashFor(event: RequestEvent): string {
  const secret = env.IP_HASH_SECRET;
  if (!secret) throw new Error("IP_HASH_SECRET is required");

  let address: string;
  try {
    address = event.getClientAddress();
  } catch {
    throw error(403, "could not determine client address");
  }

  return createHmac("sha256", secret).update(address).digest("hex");
}
