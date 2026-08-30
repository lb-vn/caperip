<script lang="ts">
  import { untrack } from "svelte";
  import type { PageData } from "./$types";
  import { useTurnstile } from "$lib/turnstile.svelte";
  import { useSpeedTest } from "$lib/speedtest.svelte";
  import { useGeolocation } from "$lib/geolocation.svelte";
  import SpeedMap from "$lib/components/SpeedMap.svelte";

  let { data }: { data: PageData } = $props();
  const siteKey = untrack(() => data.turnstileSiteKey);
  const workerUrl = untrack(() => data.speedtestUrl);

  const PAGE_SIZE = 10;
  const PHASE_LABELS: Record<string, string> = {
    info: "Checking network…",
    ping: "Testing latency",
    download: "Testing download",
    upload: "Testing upload",
  };

  const geo = useGeolocation();
  const test = useSpeedTest(workerUrl);

  let saving = $state(false);
  let saveError: string | null = $state(null);
  let saved = $state(false);
  let turnstileEl: HTMLDivElement | null = $state(null);
  const turnstile = useTurnstile(siteKey, () => turnstileEl);

  let shown = $state(PAGE_SIZE);

  const topCities = $derived(data.cities.slice(0, 3));
  const restCities = $derived(data.cities.slice(3));
  const visibleCities = $derived(restCities.slice(0, shown));

  const localCity = $derived(
    data.cities.find(
      (c) =>
        c.city.toLowerCase() === geo.location?.city?.toLowerCase() &&
        c.state.toLowerCase() === geo.location?.state?.toLowerCase(),
    ) ?? null,
  );

  function citySlug(city: string, state: string): string {
    return `${city.toLowerCase().replace(/\s+/g, "-")}-${state.toLowerCase()}`;
  }

  function startTest() {
    if (!geo.location) return;
    saved = false;
    saveError = null;
    turnstile.reset();
    test.run(geo.location);
  }

  async function postWithRetry(
    url: string,
    options: RequestInit,
    attempts = 3,
  ): Promise<Response> {
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(15000),
        });
      } catch (e) {
        lastErr = e;
        if (i < attempts - 1) {
          await new Promise((r) => setTimeout(r, 600 * (i + 1)));
        }
      }
    }
    throw lastErr;
  }

  async function saveResult() {
    const loc = geo.location;
    if (!test.pingMs || !loc || test.receipts.length === 0) return;
    if (!turnstile.canSubmit) {
      saveError = "Complete the captcha first.";
      return;
    }

    saving = true;
    saveError = null;
    try {
      const res = await postWithRetry("/api/speeds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          zip: loc.postcode ?? "00000",
          city: loc.city ?? "Unknown",
          state: loc.state ?? "XX",
          pingMs: test.pingMs,
          timeBucket: test.timeBucket,
          device: test.device || null,
          lat: loc.lat,
          lng: loc.lng,
          turnstileToken: turnstile.token,
          receipts: test.receipts,
        }),
      });

      if (res.ok) {
        saved = true;
        return;
      }
      saveError =
        res.status === 429
          ? "You already submitted a report recently. Try again later."
          : (await res.text().catch(() => "")) || "Save failed";
      turnstile.reset();
    } catch {
      saveError = "Network error — check your connection and try again.";
      turnstile.reset();
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Cape Cellular Speed Tests — Community Reports | cape.rip</title>
  <meta
    name="description"
    content="Run a live speed test on Cape Cellular's network and see community-submitted results by city."
  />
  <link rel="canonical" href="https://cape.rip/speeds" />
</svelte:head>

<main class="min-h-screen max-w-6xl mx-auto w-full px-6 pt-10 pb-16">
  <header class="mb-10">
    <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
      Speed Reports
    </h1>
    <p class="text-white/60 mt-3 text-sm leading-relaxed">
      Run a live speed test on Cape's network or browse community results by
      city.
    </p>
  </header>

  <div
    class="bg-card rounded-md p-5 sm:p-6 mb-8 min-h-[336px] flex flex-col justify-center"
  >
    {#if geo.state === "idle" || geo.state === "pending"}
      <div class="text-center">
        <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
          Your area
        </h2>
        <p class="text-white/50 text-sm mb-5 max-w-md mx-auto leading-relaxed">
          Share your location to see Cape speeds near you and to run a speed
          test on your own connection.
        </p>
        <button
          type="button"
          onclick={() => geo.request()}
          disabled={geo.state === "pending"}
          class="px-6 py-3 bg-lavender text-black font-semibold text-sm rounded hover:bg-lavender-bright transition-colors disabled:opacity-50"
        >
          {geo.state === "pending" ? "Requesting…" : "Enable location"}
        </button>
      </div>
    {:else if geo.state === "denied"}
      <div class="text-center">
        <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
          Your area
        </h2>
        <p class="text-amber-200 font-medium text-sm">Location access denied</p>
        <p class="text-xs text-white/50 mt-2 max-w-md mx-auto leading-relaxed">
          We need your location to show speeds in your area and to run a speed
          test. Enable location in your browser settings and reload the page.
        </p>
        <button
          type="button"
          onclick={() => geo.request()}
          class="mt-5 px-5 py-2.5 border border-white/20 rounded text-white/80 text-sm font-medium hover:bg-white/5 transition-colors"
        >
          Try again
        </button>
      </div>
    {:else if test.phase === "idle"}
      <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-1">
        {localCity
          ? `Cape speeds in ${localCity.city}, ${localCity.state}`
          : "Your area"}
      </h2>
      {#if localCity}
        <p class="text-xs text-white/30 mb-5">
          Based on {localCity.count} community {localCity.count === 1
            ? "report"
            : "reports"}
          &middot;
          <a
            href="/speeds/{citySlug(localCity.city, localCity.state)}"
            class="text-lavender hover:text-lavender-bright transition-colors"
          >
            view all &rarr;
          </a>
        </p>
        <div class="grid grid-cols-3 gap-4">
          {#each [["download Mbps", localCity.avgDown], ["upload Mbps", localCity.avgUp], ["ping ms", localCity.avgPing]] as [label, value]}
            <div class="text-center">
              <p class="text-3xl sm:text-4xl font-bold font-mono">{value}</p>
              <p class="text-xs text-white/40 mt-2 uppercase tracking-wider">
                {label}
              </p>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-white/50 mb-5">
          No speed reports in {geo.location?.city ?? "your area"}{geo.location
            ?.state
            ? `, ${geo.location.state}`
            : ""} yet. Run a test to be the first.
        </p>
      {/if}

      {#if workerUrl}
        <div class="text-center mt-7">
          <button
            type="button"
            onclick={startTest}
            class="px-8 py-3 bg-lavender text-black font-semibold rounded hover:bg-lavender-bright transition-colors"
          >
            Run Speed Test
          </button>
          <p class="text-xs text-white/40 mt-3">
            Requires a Cape cellular connection. Tests against Cloudflare's edge
            network.
          </p>
        </div>
      {/if}
    {:else if test.phase === "error"}
      <div class="text-center">
        <p class="text-red-300 mb-2">{test.error}</p>
        {#if test.networkInfo && !test.networkInfo.isCape}
          <p class="text-xs text-white/40">
            Detected: {test.networkInfo.asOrganization ?? "unknown"}{test
              .networkInfo.asn
              ? ` (AS${test.networkInfo.asn})`
              : ""}
          </p>
        {/if}
        <button
          type="button"
          onclick={startTest}
          class="mt-5 px-6 py-3 border border-white/20 rounded text-white/80 font-medium hover:bg-white/5 transition-colors"
        >
          Try again
        </button>
      </div>
    {:else if test.phase === "done"}
      <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
        Your result
      </h2>
      <div class="grid grid-cols-3 gap-3 mb-5">
        {#each [["down Mbps", test.downloadMbps], ["up Mbps", test.uploadMbps], ["ping ms", test.pingMs]] as [label, value]}
          <div class="bg-surface rounded px-3 py-4 text-center">
            <p class="text-2xl sm:text-4xl font-bold font-mono">{value}</p>
            <p
              class="text-[10px] sm:text-xs text-white/40 mt-2 uppercase tracking-wider"
            >
              {label}
            </p>
          </div>
        {/each}
      </div>

      <div
        class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40 mb-5"
      >
        {#if geo.location?.city}
          <span
            >{geo.location.city}{geo.location.state
              ? `, ${geo.location.state}`
              : ""}
            {geo.location.postcode ?? ""}</span
          >
        {/if}
        {#if test.networkInfo?.colo}
          <span>Tested via {test.networkInfo.colo}</span>
        {/if}
      </div>

      {#if saved}
        <div
          class="p-4 bg-emerald-500/10 border border-emerald-400/20 rounded fade-in"
        >
          <p class="text-emerald-300 font-medium">Result saved.</p>
          <p class="text-sm text-white/60 mt-1">Thanks for contributing.</p>
        </div>
      {:else}
        <div class="flex flex-col gap-4">
          {#if siteKey}
            <div bind:this={turnstileEl}></div>
          {/if}
          {#if saveError}
            <p class="text-sm text-red-300">{saveError}</p>
          {/if}
          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onclick={saveResult}
              disabled={saving || !turnstile.canSubmit}
              class="px-6 py-3 bg-lavender text-black font-semibold rounded hover:bg-lavender-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save result"}
            </button>
            <button
              type="button"
              onclick={startTest}
              class="px-6 py-3 border border-white/20 rounded text-white/80 font-medium hover:bg-white/5 transition-colors"
            >
              Run again
            </button>
            <span class="text-xs text-white/40">One report per hour.</span>
          </div>
        </div>
      {/if}
    {:else}
      {@const live =
        test.phase === "ping"
          ? test.pingMs
          : test.phase === "download"
            ? test.downloadMbps
            : test.uploadMbps}
      <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
        {PHASE_LABELS[test.phase] ?? "Speed test"}
      </h2>
      <p
        class="text-5xl sm:text-6xl font-bold font-mono mb-4 {live
          ? ''
          : 'animate-pulse text-white/40'}"
      >
        {live ?? "—"}
        <span class="text-lg text-white/40 font-normal"
          >{test.phase === "ping" ? "ms" : "Mbps"}</span
        >
      </p>

      {#if test.phase !== "info"}
        <div class="w-full h-1 bg-white/10 overflow-hidden">
          <div
            class="h-full bg-lavender transition-all duration-300 ease-out"
            style="width: {test.progress * 100}%"
          ></div>
        </div>
      {/if}

      {#if test.pingMs && test.phase !== "ping"}
        <div class="flex gap-6 mt-4 text-xs text-white/40">
          <span
            >Ping: <span class="text-white/70 font-mono">{test.pingMs} ms</span
            ></span
          >
          {#if test.downloadMbps && test.phase === "upload"}
            <span
              >Down: <span class="text-white/70 font-mono"
                >{test.downloadMbps} Mbps</span
              ></span
            >
          {/if}
        </div>
      {/if}
    {/if}
  </div>

  {#if data.cities.length > 0}
    <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
      Community results
    </h2>
    <div
      class="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start mb-10"
    >
      <div class="min-w-0">
        <SpeedMap cities={data.cities} />
      </div>
      <div class="flex flex-col gap-3 min-w-0">
        <h3 class="text-xs uppercase tracking-[0.2em] text-white/40">
          Top cities
        </h3>
        {#each topCities as c (c.city + c.state)}
          <a
            href="/speeds/{citySlug(c.city, c.state)}"
            class="bg-card border border-lavender/15 rounded-md px-5 py-3 hover:bg-white/4 transition-colors block group"
          >
            <div class="flex items-baseline justify-between gap-3 mb-3">
              <h4 class="font-bold group-hover:text-lavender transition-colors">
                {c.city}, {c.state}
              </h4>
              <span class="text-xs text-white/40 shrink-0"
                >{c.count} {c.count === 1 ? "report" : "reports"}</span
              >
            </div>
            <div class="grid grid-cols-3 gap-3 text-center">
              {#each [["down", c.avgDown], ["up", c.avgUp], ["ping", c.avgPing]] as [label, value]}
                <div>
                  <p class="text-xl font-bold font-mono">{value}</p>
                  <p class="text-xs text-white/40">{label}</p>
                </div>
              {/each}
            </div>
          </a>
        {/each}
      </div>
    </div>

    {#if restCities.length > 0}
      <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
        All cities
      </h2>
      <div class="bg-card rounded-md overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr
              class="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider"
            >
              <th class="text-left py-3 px-4 font-medium">City</th>
              <th class="text-right py-3 px-4 font-medium">Reports</th>
              <th class="text-right py-3 px-4 font-medium">Down</th>
              <th class="text-right py-3 px-4 font-medium">Up</th>
              <th class="text-right py-3 px-4 font-medium">Ping</th>
            </tr>
          </thead>
          <tbody>
            {#each visibleCities as c (c.city + c.state)}
              <tr
                class="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td class="py-3 px-4">
                  <a
                    href="/speeds/{citySlug(c.city, c.state)}"
                    class="text-white hover:text-lavender transition-colors font-medium"
                  >
                    {c.city}, {c.state}
                  </a>
                </td>
                <td class="text-right py-3 px-4 text-white/50">{c.count}</td>
                <td class="text-right py-3 px-4 font-mono"
                  >{c.avgDown} <span class="text-white/40">Mbps</span></td
                >
                <td class="text-right py-3 px-4 font-mono"
                  >{c.avgUp} <span class="text-white/40">Mbps</span></td
                >
                <td class="text-right py-3 px-4 font-mono"
                  >{c.avgPing} <span class="text-white/40">ms</span></td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if shown < restCities.length}
        <div class="mt-4 text-center">
          <button
            type="button"
            onclick={() => (shown += PAGE_SIZE)}
            class="px-5 py-2.5 border border-white/20 rounded text-sm text-white/80 font-medium hover:bg-white/5 transition-colors"
          >
            Show more ({restCities.length - shown} left)
          </button>
        </div>
      {/if}
    {/if}
  {:else}
    <div class="bg-card rounded-md p-10 text-center">
      <p class="text-white/50">
        No speed reports yet. Be the first to run a test.
      </p>
    </div>
  {/if}

  <p class="text-xs text-white/30 mt-8 text-right">
    Speed data contributed by <a
      href="https://coveragemap.com?ref=cape.rip"
      target="_blank"
      rel="noopener"
      class="underline hover:text-white/50 transition-colors">CoverageMap.com</a
    >
  </p>
</main>
