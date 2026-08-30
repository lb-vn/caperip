<script lang="ts">
  import type { CityStats } from "$lib/types";
  import { US_OUTLINE } from "$lib/us-outline";

  let { cities }: { cities: CityStats[] } = $props();

  const W = 960;
  const H = 600;
  const CELL = 10;
  const STEP = CELL + 2;
  const BOUNDS = { lngMin: -125, lngMax: -66.5, latMin: 24.5, latMax: 49.5 };

  const bins = $derived.by(() => {
    const map = new Map<
      string,
      { x: number; y: number; count: number; label: string }
    >();
    for (const c of cities) {
      if (c.lat == null || c.lng == null) continue;
      const col = Math.floor(
        (((c.lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin)) * W) /
          STEP,
      );
      const row = Math.floor(
        (((BOUNDS.latMax - c.lat) / (BOUNDS.latMax - BOUNDS.latMin)) * H) /
          STEP,
      );
      if (col < 0 || col * STEP >= W || row < 0 || row * STEP >= H) continue;

      const key = `${col},${row}`;
      const hit = map.get(key);
      if (hit) hit.count += c.count;
      else
        map.set(key, {
          x: col * STEP,
          y: row * STEP,
          count: c.count,
          label: `${c.city}, ${c.state}`,
        });
    }
    return [...map.values()];
  });

  const max = $derived(Math.max(...bins.map((b) => b.count), 1));

  function intensity(count: number): number {
    const r = count / max;
    return r > 0.7 ? 1 : r > 0.35 ? 0.75 : r > 0.1 ? 0.5 : 0.35;
  }
</script>

<svg
  viewBox="0 0 {W} {H}"
  class="w-full h-auto"
  style="aspect-ratio: {W} / {H}"
  role="img"
  aria-label="Map of US cities with Cape speed reports"
>
  <defs>
    <clipPath id="us-clip"><path d={US_OUTLINE} /></clipPath>
    <pattern id="grid" width={STEP} height={STEP} patternUnits="userSpaceOnUse">
      <rect width={CELL} height={CELL} rx="1.5" fill="white" opacity="0.12" />
    </pattern>
  </defs>
  <g clip-path="url(#us-clip)">
    <rect width={W} height={H} fill="url(#grid)" />
    {#each bins as bin (bin.label)}
      <rect
        x={bin.x}
        y={bin.y}
        width={CELL}
        height={CELL}
        rx="1.5"
        class="cell"
        style="--op: {intensity(bin.count)}"
      >
        <title
          >{bin.label}: {bin.count}
          {bin.count === 1 ? "report" : "reports"}</title
        >
      </rect>
    {/each}
  </g>
</svg>

<style>
  .cell {
    fill: var(--color-lavender);
    opacity: calc(var(--op) * 0.7);
    animation: pulse 4s ease-in-out infinite;
  }
  @keyframes pulse {
    50% {
      opacity: var(--op);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .cell {
      animation: none;
    }
  }
</style>
