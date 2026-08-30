<script lang="ts">
  import type { PageData } from "./$types";
  import { capeUrl, featureUrls } from "$lib/track";

  let { data }: { data: PageData } = $props();

  const featureLinks = featureUrls("compare_carrier_feature", {
    "IMSI rotation": "identifier-rotation",
    "SIM swap protection": "sim-swap-protection",
    "SS7 lock": "network-lock",
    "Private payment": "private-payment",
    "2 free secondary numbers": "secondary-numbers",
    "50+ country roaming": "secure-global-roaming",
  });

  let lines = $state(1);

  let capeCost = $derived(data.cape.pricePerLine[lines - 1] * lines);
  let carrierCost = $derived(data.carrier.pricePerLine[lines - 1] * lines);
  let monthlyDiff = $derived(capeCost - carrierCost);
  let yearlyDiff = $derived(monthlyDiff * 12);

  let referralDiscount = $derived(lines * 20);
  let capeWithReferrals = $derived(Math.max(0, capeCost - referralDiscount));
  let monthlyDiffWithReferrals = $derived(capeWithReferrals - carrierCost);
</script>

<svelte:head>
  <title
    >Cape vs {data.carrier.name} — Price & Feature Comparison | cape.rip</title
  >
  <meta
    name="description"
    content="Side-by-side comparison of Cape Cellular (${data.cape
      .pricePerLine[0]}/mo) vs {data.carrier.name} (${data.carrier
      .pricePerLine[0]}/mo). Compare pricing, features, network coverage, and privacy."
  />
  <link rel="canonical" href="https://cape.rip/compare/{data.slug}" />
  <meta
    property="og:title"
    content="Cape vs {data.carrier
      .name} — Price & Feature Comparison | cape.rip"
  />
  <meta
    property="og:description"
    content="Cape at ${data.cape.pricePerLine[0]}/mo vs {data.carrier
      .name} at ${data.carrier
      .pricePerLine[0]}/mo. Full feature and pricing breakdown."
  />
  <meta property="og:url" content="https://cape.rip/compare/{data.slug}" />

  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: data.cape.name,
        description: `${data.cape.name} — ${data.cape.network}. ${data.cape.dataNote}. Features: ${data.cape.features.join(", ")}.`,
        url: data.cape.source,
        offers: {
          "@type": "Offer",
          price: data.cape.pricePerLine[0],
          priceCurrency: "USD",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: data.cape.pricePerLine[0],
            priceCurrency: "USD",
            billingDuration: "P1M",
          },
        },
      },
      {
        "@type": "Product",
        name: data.carrier.name,
        description: `${data.carrier.name} — ${data.carrier.network}. ${data.carrier.dataNote}. Features: ${data.carrier.features.join(", ")}.`,
        url: data.carrier.source,
        offers: {
          "@type": "Offer",
          price: data.carrier.pricePerLine[0],
          priceCurrency: "USD",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: data.carrier.pricePerLine[0],
            priceCurrency: "USD",
            billingDuration: "P1M",
          },
        },
      },
    ],
  })}</script>`}
</svelte:head>

<main class="min-h-screen">
  <section class="max-w-6xl mx-auto w-full px-6 pt-10 pb-8">
    <a
      href="/compare"
      class="text-xs text-white/40 hover:text-white/60 transition-colors"
    >
      &larr; All comparisons
    </a>
    <h1 class="text-3xl sm:text-4xl font-black tracking-tight mt-4">
      Cape vs {data.carrier.name}
    </h1>
    <p class="text-white/60 mt-3 text-sm leading-relaxed">
      A straight look at what you get with each plan, what you pay, and where
      the tradeoffs are.
    </p>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-card border border-lavender/15 rounded-md p-5 sm:p-6">
        <p class="text-xs uppercase tracking-[0.2em] text-lavender mb-2">
          Privacy carrier
        </p>
        <h2 class="text-xl font-bold">{data.cape.name}</h2>
        <p class="text-3xl font-mono font-bold mt-4">
          ${data.cape.pricePerLine[0]}<span
            class="text-sm text-white/40 font-normal">/mo per line</span
          >
        </p>

        <div class="mt-6 space-y-4">
          <div>
            <p class="text-xs uppercase tracking-wider text-white/40 mb-2">
              Network
            </p>
            <p class="text-sm text-white/80">{data.cape.network}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider text-white/40 mb-2">
              Data
            </p>
            <p class="text-sm text-white/80">{data.cape.dataNote}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider text-white/40 mb-2">
              Features
            </p>
            <ul class="space-y-1.5">
              {#each data.cape.features as feature}
                <li class="text-sm text-white/80 flex items-start gap-2">
                  <span class="text-lavender mt-0.5 shrink-0">+</span>
                  {#if featureLinks[feature]}
                    <a
                      href={featureLinks[feature]}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="underline decoration-white/20 hover:decoration-white/50 transition-colors"
                      >{feature}</a
                    >
                  {:else}
                    {feature}
                  {/if}
                </li>
              {/each}
            </ul>
          </div>
        </div>

        <a
          href={capeUrl("/", "compare_source")}
          target="_blank"
          rel="noopener noreferrer"
          class="mt-6 inline-block text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          Source: cape.co
        </a>
      </div>

      <div class="bg-card rounded-md p-5 sm:p-6">
        <p class="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
          Mainstream carrier
        </p>
        <h2 class="text-xl font-bold">{data.carrier.name}</h2>
        <p class="text-3xl font-mono font-bold mt-4">
          ${data.carrier.pricePerLine[0]}<span
            class="text-sm text-white/40 font-normal">/mo per line</span
          >
        </p>

        <div class="mt-6 space-y-4">
          <div>
            <p class="text-xs uppercase tracking-wider text-white/40 mb-2">
              Network
            </p>
            <p class="text-sm text-white/80">{data.carrier.network}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider text-white/40 mb-2">
              Data
            </p>
            <p class="text-sm text-white/80">{data.carrier.dataNote}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider text-white/40 mb-2">
              Features
            </p>
            <ul class="space-y-1.5">
              {#each data.carrier.features as feature}
                <li class="text-sm text-white/80 flex items-start gap-2">
                  <span class="text-white/40 mt-0.5 shrink-0">+</span>
                  {feature}
                </li>
              {/each}
            </ul>
          </div>
        </div>

        <a
          href={data.carrier.source}
          target="_blank"
          rel="noopener noreferrer"
          class="mt-6 inline-block text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          Source: {data.carrier.source
            .replace(/^https?:\/\/(www\.)?/, "")
            .replace(/\/.*$/, "")}
        </a>
      </div>
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <div class="bg-card rounded-md p-5 sm:p-6">
      <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-6">
        Cost comparison
      </h2>

      <div class="flex items-center gap-4 mb-6">
        <label class="flex flex-col gap-2">
          <span class="text-xs uppercase tracking-wider text-white/50"
            >Lines</span
          >
          <div class="relative">
            <select
              bind:value={lines}
              class="bg-surface border border-white/10 rounded px-4 py-3 pr-10 text-sm focus:outline-none focus:border-lavender appearance-none w-full"
            >
              {#each [1, 2, 3, 4, 5] as n}
                <option value={n}>{n} line{n > 1 ? "s" : ""}</option>
              {/each}
            </select>
            <svg
              class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              /></svg
            >
          </div>
        </label>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="bg-surface rounded p-4">
          <p class="text-xs text-white/40 mb-1">Cape monthly</p>
          <p class="text-2xl font-mono font-bold">${capeCost}</p>
        </div>
        <div class="bg-surface rounded p-4">
          <p class="text-xs text-white/40 mb-1">{data.carrier.name} monthly</p>
          <p class="text-2xl font-mono font-bold">${carrierCost}</p>
        </div>
        <div class="bg-surface rounded p-4">
          <p class="text-xs text-white/40 mb-1">Monthly difference</p>
          <p
            class="text-2xl font-mono font-bold {monthlyDiff > 0
              ? 'text-red-400'
              : monthlyDiff < 0
                ? 'text-emerald-400'
                : 'text-white/60'}"
          >
            {#if monthlyDiff > 0}
              Cape costs ${monthlyDiff} more
            {:else if monthlyDiff < 0}
              Cape saves ${Math.abs(monthlyDiff)}
            {:else}
              Same price
            {/if}
          </p>
          <p class="text-xs text-white/40 mt-2">
            {#if yearlyDiff > 0}
              +${yearlyDiff}/yr more
            {:else if yearlyDiff < 0}
              Save ${Math.abs(yearlyDiff)}/yr
            {:else}
              $0/yr
            {/if}
          </p>
        </div>
      </div>

      {#if lines > 1}
        <div class="bg-surface rounded mt-6 p-6">
          <p class="text-xs uppercase tracking-[0.2em] text-lavender/60 mb-2">
            With referrals
          </p>
          <p class="text-xs text-white/50 mb-4">
            Each Cape line can use a referral code for $20/mo off. With {lines} lines,
            that's ${referralDiscount}/mo saved.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div class="bg-surface rounded p-4">
              <p class="text-xs text-white/40 mb-1">Cape with referrals</p>
              <p class="text-2xl font-mono font-bold text-lavender">
                ${capeWithReferrals}/mo
              </p>
            </div>
            <div class="bg-surface rounded p-4">
              <p class="text-xs text-white/40 mb-1">
                {data.carrier.name} monthly
              </p>
              <p class="text-2xl font-mono font-bold">${carrierCost}/mo</p>
            </div>
            <div class="bg-surface rounded p-4">
              <p class="text-xs text-white/40 mb-1">
                Difference with referrals
              </p>
              <p
                class="text-2xl font-mono font-bold {monthlyDiffWithReferrals >
                0
                  ? 'text-red-400'
                  : monthlyDiffWithReferrals < 0
                    ? 'text-emerald-400'
                    : 'text-white/60'}"
              >
                {#if monthlyDiffWithReferrals > 0}
                  Still ${monthlyDiffWithReferrals}/mo more
                {:else if monthlyDiffWithReferrals < 0}
                  Save ${Math.abs(monthlyDiffWithReferrals)}/mo
                {:else}
                  Same price
                {/if}
              </p>
            </div>
          </div>
        </div>
      {/if}

      {#if monthlyDiff > 0}
        <p class="mt-6 text-sm text-white/50">
          Cape is ${monthlyDiff}/month more than {data.carrier.name} per line. That
          premium gets you IMSI rotation, SIM swap protection, SS7 lock, and private
          payment that
          {data.carrier.name} doesn't offer at any price tier.
          {#if lines > 1}
            With referral codes (${referralDiscount}/mo off for {lines} lines), the
            gap drops to {monthlyDiffWithReferrals > 0
              ? `$${monthlyDiffWithReferrals}`
              : "nothing"}/mo.{/if}
        </p>
      {:else if monthlyDiff < 0}
        <p class="mt-6 text-sm text-white/50">
          Cape is actually ${Math.abs(monthlyDiff)}/month cheaper than {data
            .carrier.name} per line, and you get privacy features on top of the savings.
        </p>
      {/if}
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-12">
    <div
      class="bg-lavender/4 border border-lavender/15 rounded-md p-5 sm:p-6 text-center"
    >
      <p class="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
        Switching to Cape?
      </p>
      <p class="text-sm text-white/60 leading-relaxed max-w-2xl mx-auto">
        Use a community referral code and both you and the code owner get
        $20/month off, indefinitely. Stack just 4 referrals and your $70/month
        plan is completely covered.
      </p>
      <a
        href="/"
        class="mt-6 inline-block px-6 py-3 bg-lavender text-black font-semibold rounded hover:bg-lavender-bright transition-colors"
      >
        Get a referral code
      </a>
    </div>
  </section>
</main>
