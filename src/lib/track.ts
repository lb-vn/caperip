const CAPE_ORIGIN = "https://cape.co";

export function capeUrl(
  path: string,
  campaign: string,
  extra?: Record<string, string>,
): string {
  const url = new URL(path, CAPE_ORIGIN);
  url.searchParams.set("utm_source", "cape.rip");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign);
  for (const [k, v] of Object.entries(extra ?? {})) url.searchParams.set(k, v);
  return url.toString();
}

export function featureUrls(
  campaign: string,
  slugs: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(slugs).map(([label, slug]) => [
      label,
      capeUrl(`/blog/product-feature-${slug}`, campaign),
    ]),
  );
}
