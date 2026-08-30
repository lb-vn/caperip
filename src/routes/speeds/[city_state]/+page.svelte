<script lang="ts">
  import { Sunrise, Sun, Sunset, Moon } from "@lucide/svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const timeLabels: Record<string, string> = {
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    night: "Night",
  };

  const timeIcons = {
    morning: Sunrise,
    afternoon: Sun,
    evening: Sunset,
    night: Moon,
  };

  const timeMax = $derived(
    Math.max(
      ...data.byTime.map((t) => Math.max(Number(t.avgDown), Number(t.avgUp))),
      1,
    ),
  );

  const todayStr = new Date().toLocaleDateString("en-CA");

  const dayData = $derived(
    data.byDay
      .filter((d) => d.day <= todayStr)
      .map((d) => ({
        ...d,
        date: new Date(d.day + "T12:00:00"),
      })),
  );

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const weekdayData = $derived(
    weekdayNames
      .map((name, i) => {
        const row = data.byWeekday.find((w) => w.weekday === i);
        return row ? { ...row, name } : null;
      })
      .filter((d): d is NonNullable<typeof d> => d != null),
  );

  const weekdayMax = $derived(
    Math.max(
      ...weekdayData.map((d) => Math.max(Number(d.avgDown), Number(d.avgUp))),
      1,
    ),
  );

  const hasChartData = $derived(
    data.byTime.length >= 3 || dayData.length >= 3 || weekdayData.length >= 3,
  );

  const deviceTotal = $derived(data.byDevice.reduce((s, d) => s + d.count, 0));

  let hoveredDay = $state<number | null>(null);

  let narrow = $state(false);
  $effect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => (narrow = mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  });

  const trendData = $derived(narrow ? dayData.slice(-7) : dayData);

  const trendMax = $derived(
    Math.max(
      ...trendData.map((d) => Math.max(Number(d.avgDown), Number(d.avgUp))),
      1,
    ),
  );

  const svgW = 900;
  const svgH = 200;
  const padL = 28;
  const padT = 10;
  const chartW = svgW - padL - 22;
  const chartH = svgH - padT - 30;

  function pointX(i: number): number {
    return (
      padL +
      (trendData.length === 1
        ? chartW / 2
        : (i / (trendData.length - 1)) * chartW)
    );
  }

  function pointY(value: number): number {
    return padT + chartH - (value / trendMax) * chartH;
  }

  function trendPoints(key: "avgDown" | "avgUp"): string {
    return trendData
      .map((d, i) => `${pointX(i)},${pointY(Number(d[key]))}`)
      .join(" ");
  }

  function trackHover(event: MouseEvent) {
    const box = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * svgW;
    let nearest = 0;
    for (let i = 1; i < trendData.length; i++) {
      if (Math.abs(pointX(i) - x) < Math.abs(pointX(nearest) - x)) nearest = i;
    }
    hoveredDay = nearest;
  }

  function trendAreaPath(key: "avgDown" | "avgUp"): string {
    if (trendData.length === 0) return "";
    const baseline = padT + chartH;
    const line = trendData
      .map((d, i) => `L${pointX(i)},${pointY(Number(d[key]))}`)
      .join(" ");
    return `M${pointX(0)},${baseline} ${line} L${pointX(trendData.length - 1)},${baseline} Z`;
  }
</script>

<svelte:head>
  <title>Cape Cellular Speeds in {data.city}, {data.state} | cape.rip</title>
  <meta
    name="description"
    content="Cape Cellular speed tests in {data.city}, {data.state}. Average download {data
      .stats.avgDown} Mbps, upload {data.stats.avgUp} Mbps, ping {data.stats
      .avgPing} ms from {data.stats.count} community reports."
  />
  <link
    rel="canonical"
    href="https://cape.rip/speeds/{data.city
      .toLowerCase()
      .replace(/\s+/g, '-')}-{data.state.toLowerCase()}"
  />
</svelte:head>

<main class="min-h-screen max-w-6xl mx-auto w-full px-6 pt-10 pb-16">
  <a
    href="/speeds"
    class="text-xs text-white/40 hover:text-white/60 transition-colors"
    >&larr; All speed reports</a
  >

  <header class="mt-4 mb-10">
    <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
      Cape speeds in {data.city}, {data.state}
    </h1>
    <p class="text-white/60 mt-3 text-sm leading-relaxed">
      {data.stats.count}
      {data.stats.count === 1 ? "report" : "reports"} from the community
    </p>
  </header>

  <div class="grid grid-cols-3 gap-3 sm:gap-4 mb-10">
    {#each [["avg download Mbps", data.stats.avgDown], ["avg upload Mbps", data.stats.avgUp], ["avg ping ms", data.stats.avgPing]] as [label, value]}
      <div
        class="bg-card border border-lavender/15 rounded-md p-4 sm:p-6 text-center"
      >
        <p class="text-3xl sm:text-4xl font-bold font-mono">{value}</p>
        <p
          class="text-[10px] sm:text-xs text-white/40 mt-2 uppercase tracking-wide sm:tracking-wider text-balance"
        >
          {label}
        </p>
      </div>
    {/each}
  </div>

  {#if hasChartData}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
      {#if data.byTime.length >= 3}
        <div class="bg-card rounded-md p-6">
          <h2
            class="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4"
          >
            Speed by time of day
          </h2>
          <div class="flex items-center gap-4 text-xs text-white/50 mb-4">
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-lavender inline-block"></span> Download
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-lavender/50 inline-block"
              ></span> Upload
            </span>
          </div>
          <div class="flex flex-col gap-4">
            {#each data.byTime as t}
              {@const Icon = timeIcons[t.timeBucket as keyof typeof timeIcons]}
              <div class="flex items-center gap-3">
                <span
                  class="flex items-center gap-1.5 w-24 shrink-0 text-xs text-white/40"
                >
                  <Icon size={14} />
                  {timeLabels[t.timeBucket] ?? t.timeBucket}
                </span>
                <div class="flex-1 flex flex-col gap-1.5">
                  <div class="flex items-center gap-2">
                    <div
                      class="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden"
                    >
                      <div
                        class="h-full bg-lavender rounded-full"
                        style="width: {(Number(t.avgDown) / timeMax) * 100}%"
                      ></div>
                    </div>
                    <span
                      class="text-xs text-lavender font-mono w-12 text-right"
                      >{t.avgDown}</span
                    >
                  </div>
                  <div class="flex items-center gap-2">
                    <div
                      class="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden"
                    >
                      <div
                        class="h-full bg-lavender/50 rounded-full"
                        style="width: {(Number(t.avgUp) / timeMax) * 100}%"
                      ></div>
                    </div>
                    <span
                      class="text-xs text-lavender/70 font-mono w-12 text-right"
                      >{t.avgUp}</span
                    >
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if weekdayData.length >= 3}
        <div class="bg-card rounded-md p-6">
          <h2
            class="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4"
          >
            Speed by day of week
          </h2>
          <div class="flex items-center gap-4 text-xs text-white/50 mb-4">
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-lavender inline-block"></span> Download
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-lavender/50 inline-block"
              ></span> Upload
            </span>
          </div>
          <div class="flex items-end gap-1 sm:gap-1.5 h-44 sm:h-52">
            {#each weekdayData as d}
              <div class="flex-1 flex flex-col items-center h-full min-w-0">
                <div
                  class="flex-1 w-full flex items-end justify-center gap-px sm:gap-0.5"
                >
                  <div
                    class="w-1/2 h-full flex flex-col items-center justify-end"
                  >
                    <span
                      class="text-[9px] sm:text-[10px] text-lavender font-mono mb-0.5 sm:mb-1"
                      >{narrow
                        ? Math.round(Number(d.avgDown))
                        : d.avgDown}</span
                    >
                    <div
                      class="w-full bg-lavender rounded-t"
                      style="height: {(Number(d.avgDown) / weekdayMax) * 100}%"
                    ></div>
                  </div>
                  <div
                    class="w-1/2 h-full flex flex-col items-center justify-end"
                  >
                    <span
                      class="text-[9px] sm:text-[10px] text-lavender/70 font-mono mb-0.5 sm:mb-1"
                      >{narrow ? Math.round(Number(d.avgUp)) : d.avgUp}</span
                    >
                    <div
                      class="w-full bg-lavender/50 rounded-t"
                      style="height: {(Number(d.avgUp) / weekdayMax) * 100}%"
                    ></div>
                  </div>
                </div>
                <span class="text-[10px] sm:text-xs text-white/40 mt-1 sm:mt-2"
                  >{d.name}</span
                >
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if trendData.length >= 3}
        <div class="bg-card rounded-md p-4 sm:p-6 lg:col-span-2">
          <h2
            class="text-sm font-semibold uppercase tracking-wider text-white/60 mb-3 sm:mb-4"
          >
            Recent speed trend
          </h2>
          <div
            class="flex items-center gap-4 text-xs text-white/50 mb-3 sm:mb-4"
          >
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-lavender inline-block"></span> Download
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-lavender/50 inline-block"
              ></span> Upload
            </span>
          </div>
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="relative" onmouseleave={() => (hoveredDay = null)}>
            <svg
              viewBox="0 0 {svgW} {svgH}"
              class="w-full h-auto"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Average download and upload speed per day"
              onmousemove={trackHover}
            >
              {#each [0, 0.25, 0.5, 0.75, 1] as tick}
                <line
                  x1={padL}
                  x2={padL + chartW}
                  y1={padT + chartH * (1 - tick)}
                  y2={padT + chartH * (1 - tick)}
                  stroke="white"
                  stroke-opacity="0.05"
                />
                <text
                  x={padL - 4}
                  y={padT + chartH * (1 - tick) + 4}
                  text-anchor="end"
                  fill="white"
                  fill-opacity="0.3"
                  font-size="10">{Math.round(trendMax * tick)}</text
                >
              {/each}
              <path
                d={trendAreaPath("avgDown")}
                fill="#8b9fb8"
                fill-opacity="0.12"
              />
              <polyline
                points={trendPoints("avgDown")}
                fill="none"
                stroke="#8b9fb8"
                stroke-width="2"
              />
              <path
                d={trendAreaPath("avgUp")}
                fill="#5a6b7e"
                fill-opacity="0.15"
              />
              <polyline
                points={trendPoints("avgUp")}
                fill="none"
                stroke="#5a6b7e"
                stroke-width="2"
              />
              {#each trendData as d, i}
                {@const x = pointX(i)}
                {@const downY = pointY(Number(d.avgDown))}
                {@const upY = pointY(Number(d.avgUp))}
                {#if hoveredDay === i}
                  <line
                    x1={x}
                    x2={x}
                    y1={padT}
                    y2={padT + chartH}
                    stroke="white"
                    stroke-opacity="0.15"
                    stroke-dasharray="3,3"
                  />
                {/if}
                <circle
                  cx={x}
                  cy={downY}
                  r={hoveredDay === i ? 5 : 3}
                  fill="#8b9fb8"
                />
                <circle
                  cx={x}
                  cy={upY}
                  r={hoveredDay === i ? 5 : 3}
                  fill="#5a6b7e"
                />
              {/each}
              {#each trendData as d, i}
                {@const x = pointX(i)}
                {@const isToday = d.day === todayStr}
                <text
                  {x}
                  y={svgH - 5}
                  text-anchor="middle"
                  fill="white"
                  fill-opacity={isToday ? 0.6 : 0.3}
                  font-size="10"
                  font-weight={isToday ? "bold" : "normal"}
                  >{isToday
                    ? "Today"
                    : d.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}</text
                >
              {/each}
            </svg>
            {#if hoveredDay !== null && trendData[hoveredDay]}
              {@const d = trendData[hoveredDay]}
              {@const xPct = (pointX(hoveredDay) / svgW) * 100}
              <div
                class="absolute top-0 pointer-events-none z-10"
                style="left: {xPct}%; transform: translateX(-50%);"
              >
                <div
                  class="bg-neutral-900 border border-white/10 rounded px-3 py-2 shadow-lg text-xs whitespace-nowrap"
                >
                  <p class="text-white/50 mb-1">
                    {d.day === todayStr
                      ? "Today"
                      : d.date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                  </p>
                  <p class="font-mono" style="color: #8b9fb8;">
                    {d.avgDown} <span class="text-white/40">down</span>
                  </p>
                  <p class="font-mono" style="color: #6a7b8e;">
                    {d.avgUp} <span class="text-white/40">up</span>
                  </p>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    {#if data.byDevice.length >= 2}
      <div class="bg-card rounded-md p-6 mb-10">
        <h2
          class="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4"
        >
          Device breakdown
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {#each data.byDevice as d}
            <div
              class="flex items-center justify-between bg-surface rounded px-4 py-3"
            >
              <div>
                <p class="text-sm font-medium">{d.device}</p>
                <p class="text-xs text-white/40">
                  {d.count}
                  {d.count === 1 ? "test" : "tests"} &middot; {d.avgDown} Mbps
                </p>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-20 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-lavender rounded-full"
                    style="width: {(d.count / deviceTotal) * 100}%"
                  ></div>
                </div>
                <span class="text-xs text-white/40 font-mono w-10 text-right">
                  {Math.round((d.count / deviceTotal) * 100)}%
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}

  <h2 class="text-sm font-semibold uppercase tracking-wider text-white/60 mb-3">
    Recent tests
  </h2>
  <div class="bg-card rounded-md overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-white/10 text-left">
          <th
            class="px-4 py-3 text-xs uppercase tracking-wider text-white/40 font-medium"
            >Date</th
          >
          <th
            class="px-4 py-3 text-xs uppercase tracking-wider text-white/40 font-medium"
            >Down</th
          >
          <th
            class="px-4 py-3 text-xs uppercase tracking-wider text-white/40 font-medium"
            >Up</th
          >
          <th
            class="px-4 py-3 text-xs uppercase tracking-wider text-white/40 font-medium"
            >Ping</th
          >
          <th
            class="px-4 py-3 text-xs uppercase tracking-wider text-white/40 font-medium"
            >Time</th
          >
          <th
            class="px-4 py-3 text-xs uppercase tracking-wider text-white/40 font-medium"
            >Device</th
          >
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        {#each data.reports as r}
          <tr class="hover:bg-white/2">
            <td class="px-4 py-3 text-white/60">{formatDate(r.createdAt)}</td>
            <td class="px-4 py-3 font-mono"
              >{r.downMbps} <span class="text-white/40">Mbps</span></td
            >
            <td class="px-4 py-3 font-mono"
              >{r.upMbps} <span class="text-white/40">Mbps</span></td
            >
            <td class="px-4 py-3 font-mono"
              >{r.pingMs} <span class="text-white/40">ms</span></td
            >
            <td class="px-4 py-3 text-white/60 capitalize">{r.timeBucket}</td>
            <td class="px-4 py-3 text-white/60">{r.device ?? "—"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="mt-8 flex items-center justify-between">
    <a
      href="/speeds"
      class="text-xs text-lavender hover:text-lavender-bright transition-colors"
      >&larr; Back to all cities</a
    >
    <p class="text-xs text-white/30">
      Speed data contributed by <a
        href="https://coveragemap.com?ref=cape.rip"
        target="_blank"
        rel="noopener"
        class="underline hover:text-white/50 transition-colors"
        >CoverageMap.com</a
      >
    </p>
  </div>
</main>
