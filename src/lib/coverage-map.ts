import { env } from "$env/dynamic/public";

// Mapbox style Cape publishes on cape.co/coverage. The token is not committed:
// supply your own in PUBLIC_MAPBOX_TOKEN, or leave it unset and the preview is
// hidden. It ends up in page source either way, so use a public (pk.) token
// restricted to your domain.
const EMBED =
  "https://api.mapbox.com/styles/v1/sdowhy/cmqqp2jl1000c01s11hykb06w.html";

// hash is zoom/lat/lng
export function coverageMapUrl(zoom = 4.0): string | null {
  const token = env.PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;
  return `${EMBED}?title=false&access_token=${token}&zoomwheel=false#${zoom}/38.0/-96.06`;
}
