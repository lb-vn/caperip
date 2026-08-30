<script lang="ts">
  import type { PageData } from "./$types";
  import type { ServiceState } from "$lib/types";

  let { data }: { data: PageData } = $props();
  const status = $derived(data.status);

  const STYLES: Record<
    ServiceState,
    { dot: string; text: string; pill: string; banner: string; icon: string }
  > = {
    operational: {
      dot: "bg-emerald-400",
      text: "text-emerald-300",
      pill: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",
      banner: "bg-emerald-500/10 border-emerald-400/20",
      icon: "text-emerald-400",
    },
    maintenance: {
      dot: "bg-sky-400",
      text: "text-sky-300",
      pill: "bg-sky-500/10 text-sky-300 border-sky-400/20",
      banner: "bg-sky-500/10 border-sky-400/20",
      icon: "text-sky-400",
    },
    degraded: {
      dot: "bg-amber-400",
      text: "text-amber-300",
      pill: "bg-amber-500/10 text-amber-300 border-amber-400/20",
      banner: "bg-amber-500/10 border-amber-400/20",
      icon: "text-amber-400",
    },
    partial: {
      dot: "bg-orange-400",
      text: "text-orange-300",
      pill: "bg-orange-500/10 text-orange-300 border-orange-400/20",
      banner: "bg-orange-500/10 border-orange-400/20",
      icon: "text-orange-400",
    },
    major: {
      dot: "bg-red-400",
      text: "text-red-300",
      pill: "bg-red-500/10 text-red-300 border-red-400/20",
      banner: "bg-red-500/10 border-red-400/20",
      icon: "text-red-400",
    },
    unknown: {
      dot: "bg-white/30",
      text: "text-white/50",
      pill: "bg-white/5 text-white/50 border-white/10",
      banner: "bg-white/5 border-white/10",
      icon: "text-white/40",
    },
  };

  const allOperational = $derived(status.overall.state === "operational");
  const unknown = $derived(status.overall.state === "unknown");
  const bannerHeadline = $derived(
    allOperational
      ? "All systems operational"
      : status.overall.headline || "Some systems are experiencing issues",
  );

  // title and description answer "is cape down?" live, so the search snippet reflects the current state
  const isDownAnswer = $derived(
    allOperational
      ? "No. Cape Cellular is up and all systems are operational."
      : unknown
        ? "Cape Cellular's live status is temporarily unavailable — please check back shortly."
        : `Cape Cellular is experiencing issues: ${bannerHeadline}.`,
  );
  const pageTitle = $derived(
    allOperational
      ? "Cape Cellular Status — Is Cape Down? All Systems Operational"
      : unknown
        ? "Cape Cellular Status — Is Cape Down?"
        : "Cape Cellular Status — Is Cape Down? Service Disruption Reported",
  );
  const metaDescription = $derived(
    `${isDownAnswer} Check the real-time status of the Cape Cellular network ` +
      `and app, current outages, and a history of past incidents and service ` +
      `disruptions.`,
  );
  const canonical = "https://cape.rip/status";

  const faqLd = $derived({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is Cape Cellular down right now?",
        acceptedAnswer: { "@type": "Answer", text: isDownAnswer },
      },
      {
        "@type": "Question",
        name: "What is the current status of Cape Cellular?",
        acceptedAnswer: {
          "@type": "Answer",
          text: [
            `${bannerHeadline}.`,
            ...status.services.map((s) => `${s.name}: ${s.statusLabel}.`),
          ].join(" "),
        },
      },
    ],
  });

  function fmtDate(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? ""
      : d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
  }
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={metaDescription} />
  <meta
    name="keywords"
    content="Cape status, is Cape down, Cape Cellular status, Cape outage, Cape Cellular down, Cape network status, Cape service status"
  />
  <link rel="canonical" href={canonical} />

  <meta property="og:type" content="website" />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={metaDescription} />
  <meta property="og:url" content={canonical} />
  <meta property="og:site_name" content="Cape Cellular Status" />

  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={metaDescription} />

  {@html `<script type="application/ld+json">${JSON.stringify(faqLd).replace(/</g, "\\u003c")}</script>`}
</svelte:head>

<main class="min-h-screen max-w-6xl mx-auto w-full px-6 pt-10 pb-16">
  <header class="mb-10">
    <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
      Cape Cellular Status
    </h1>
    <p class="text-white/60 mt-3 text-sm leading-relaxed">
      Is Cape down? Check the real-time status of the Cape Cellular network and
      app below, including current outages and a history of past incidents.
    </p>
  </header>

  <div
    class="rounded-md border p-5 sm:p-6 mb-8 flex items-center gap-4 {STYLES[
      status.overall.state
    ].banner}"
  >
    <div class="shrink-0 {STYLES[status.overall.state].icon}">
      <svg
        class="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d={allOperational
            ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            : "M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z"}
        />
      </svg>
    </div>
    <div class="min-w-0">
      <p
        class="text-lg sm:text-xl font-bold break-words {STYLES[
          status.overall.state
        ].text}"
      >
        {bannerHeadline}
      </p>
      <p class="text-xs text-white/40 mt-0.5">Cape Cellular network</p>
    </div>
  </div>

  <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
    Services
  </h2>
  {#if status.services.length > 0}
    <div class="bg-card rounded-md divide-y divide-white/5 mb-10">
      {#each status.services as svc (svc.id)}
        <div class="flex items-center justify-between gap-4 px-5 py-4">
          <span class="font-medium min-w-0 break-words">{svc.name}</span>
          <span
            class="flex items-center gap-2 text-sm shrink-0 {STYLES[svc.state]
              .text}"
          >
            <span class="w-2 h-2 rounded-full {STYLES[svc.state].dot}"></span>
            {svc.statusLabel}
          </span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="bg-card rounded-md p-6 text-center text-white/50 mb-10">
      Service status is temporarily unavailable.
    </div>
  {/if}

  <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
    Past incidents
  </h2>

  {#if status.incidents.length > 0}
    <div class="flex flex-col gap-3">
      {#each status.incidents as inc (inc.id)}
        <article class="bg-card rounded-md p-5 overflow-hidden">
          <div class="flex items-start justify-between gap-4 mb-1">
            <div class="flex items-start gap-2 min-w-0">
              {#if inc.type === "maintenance"}
                <span
                  class="shrink-0 mt-0.5 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded border border-sky-400/20 bg-sky-500/10 text-sky-300"
                  >Maintenance</span
                >
              {/if}
              <h3 class="font-semibold leading-snug break-words min-w-0">
                {inc.title}
              </h3>
            </div>
            <span
              class="shrink-0 text-[11px] font-medium uppercase tracking-wide px-2 py-1 rounded border {STYLES[
                inc.state
              ].pill}"
            >
              {inc.resolved ? "Resolved" : inc.latestStatus}
            </span>
          </div>

          <p class="text-xs text-white/40 break-words">
            {#if inc.type === "maintenance"}<span class="text-white/50"
                >Scheduled:</span
              >&nbsp;{/if}{fmtDate(inc.startedAt)}
            {#if inc.resolvedAt}
              &rarr; {fmtDate(inc.resolvedAt)}
            {/if}
            {#if inc.affected.length > 0}
              &middot; {inc.affected.join(", ")}
            {/if}
          </p>

          {#if inc.updates.length > 0}
            <ol class="mt-4 border-l border-white/10 pl-4 flex flex-col gap-3">
              {#each inc.updates as u, i (i)}
                <li class="relative min-w-0">
                  <span
                    class="absolute -left-[21px] top-1 w-2 h-2 rounded-full {STYLES[
                      inc.state
                    ].dot}"
                  ></span>
                  <p class="text-xs font-semibold text-white/70">{u.status}</p>
                  {#if u.message}
                    <div
                      class="status-prose text-sm text-white/60 mt-0.5 leading-relaxed"
                    >
                      {@html u.message}
                    </div>
                  {/if}
                  {#if u.at}
                    <p class="text-[11px] text-white/30 mt-0.5">
                      {fmtDate(u.at)}
                    </p>
                  {/if}
                </li>
              {/each}
            </ol>
          {/if}
        </article>
      {/each}
    </div>

    {#if status.incidentsCapped}
      <p class="text-xs text-white/40 mt-4 text-center">
        Showing the {status.incidents.length} most recent incidents.
        <a
          href={status.historyUrl}
          target="_blank"
          rel="noopener"
          class="text-lavender hover:text-lavender-bright transition-colors"
        >
          View full history &rarr;
        </a>
      </p>
    {/if}
  {:else}
    <div class="bg-card rounded-md p-8 text-center">
      {#if status.historyAvailable}
        <p class="text-white/50">
          No incidents or maintenance reported. All clear. 🎉
        </p>
      {:else}
        <p class="text-white/50">
          History is temporarily unavailable. View it on Cape's status page.
        </p>
        <a
          href={status.pageUrl}
          target="_blank"
          rel="noopener"
          class="inline-block mt-3 text-sm text-lavender hover:text-lavender-bright transition-colors"
        >
          Open status page &rarr;
        </a>
      {/if}
    </div>
  {/if}
</main>

<style>
  /* tailwind's reset strips list and paragraph styling from the sanitized
     pagerduty markup, so restore the bits the allow-list permits */
  .status-prose {
    overflow-wrap: anywhere;
  }
  .status-prose :global(p) {
    margin: 0 0 0.5rem;
  }
  .status-prose :global(p:last-child) {
    margin-bottom: 0;
  }
  .status-prose :global(ul),
  .status-prose :global(ol) {
    margin: 0.25rem 0 0.5rem;
    padding-left: 1.25rem;
    list-style: revert;
  }
  .status-prose :global(li) {
    margin: 0.125rem 0;
  }
  .status-prose :global(a) {
    color: var(--color-lavender);
    text-decoration: underline;
  }
  .status-prose :global(a:hover) {
    color: var(--color-lavender-bright);
  }
  .status-prose :global(strong),
  .status-prose :global(b) {
    font-weight: 600;
    color: rgb(255 255 255 / 0.8);
  }
  .status-prose :global(code) {
    font-family: var(--font-mono);
    font-size: 0.85em;
    white-space: pre-wrap;
  }
</style>
