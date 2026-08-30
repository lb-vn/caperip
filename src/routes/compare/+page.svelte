<script lang="ts">
  import { CircleHelp } from "@lucide/svelte";
  import type { PageData } from "./$types";
  import type { Plan } from "$lib/types";
  import { featureUrls } from "$lib/track";

  let { data }: { data: PageData } = $props();

  const links = featureUrls("compare_feature", {
    "IMSI rotation": "identifier-rotation",
    "SIM swap protection": "sim-swap-protection",
    "SS7 network lock": "network-lock",
    "Private payment": "private-payment",
    "Secondary numbers": "secondary-numbers",
    "International roaming": "secure-global-roaming",
    "Call log retention": "disappearing-call-logs",
  });

  let customBill = $state(65);
  let lines = $state(1);
  let selectedSlug = $state("verizon");

  const isCustom = $derived(selectedSlug === "other");

  let selectedCarrier: Plan | null = $derived(
    isCustom ? null : (data.plans.find((p) => p.slug === selectedSlug) ?? null),
  );

  const carrierName = $derived(
    isCustom ? "Your plan" : (selectedCarrier?.name ?? "Other"),
  );

  let capeMonthlyCost = $derived(data.cape.pricePerLine[lines - 1] * lines);
  let carrierMonthlyCost = $derived(
    isCustom
      ? customBill
      : (selectedCarrier?.pricePerLine[lines - 1] ?? 0) * lines,
  );
  let monthlyDiff = $derived(capeMonthlyCost - carrierMonthlyCost);
  let yearlyDiff = $derived(monthlyDiff * 12);

  let referralDiscount = $derived(lines * 20);
  let capeWithReferrals = $derived(
    Math.max(0, capeMonthlyCost - referralDiscount),
  );
  let monthlyDiffWithReferrals = $derived(
    capeWithReferrals - carrierMonthlyCost,
  );

  const nonCapeCarriers = $derived(data.plans.filter((p) => p.slug !== "cape"));

  interface FeatureRow {
    label: string;
    cape: string | boolean;
    get: (carrier: Plan | null) => string | boolean;
  }

  const featureRows: FeatureRow[] = $derived([
    {
      label: "Monthly price (per line)",
      cape: `$${data.cape.pricePerLine[lines - 1]}`,
      get: (c) =>
        !c
          ? `$${customBill}`
          : `$${c.pricePerLine[lines - 1]}${!c.taxesIncluded ? "*" : ""}`,
    },
    {
      label: "Taxes & fees included",
      cape: true,
      get: (c) => (!c ? "Varies" : c.taxesIncluded),
    },
    {
      label: "Unlimited data",
      cape: true,
      get: () => true,
    },
    {
      label: "Mobile hotspot",
      cape: true,
      get: (c) =>
        !c
          ? "Varies"
          : c.slug === "tmobile"
            ? "Not included"
            : c.slug === "att"
              ? "3GB"
              : c.slug === "verizon"
                ? "30GB"
                : c.slug === "mint"
                  ? "20GB"
                  : c.slug === "usmobile"
                    ? "Unlimited"
                    : true,
    },
    {
      label: "International roaming",
      cape: "50+ countries",
      get: (c) =>
        !c
          ? "Varies"
          : c.slug === "googlefi"
            ? "200+ countries"
            : c.slug === "visible"
              ? "140+ countries"
              : c.slug === "verizon" || c.slug === "att"
                ? "Paid add-on"
                : c.slug === "usmobile"
                  ? "20GB data"
                  : false,
    },
    {
      label: "Secondary numbers",
      cape: "2 free",
      get: () => false,
    },
    {
      label: "IMSI rotation",
      cape: true,
      get: () => false,
    },
    {
      label: "SIM swap protection",
      cape: true,
      get: () => false,
    },
    {
      label: "SS7 network lock",
      cape: true,
      get: () => false,
    },
    {
      label: "Private payment",
      cape: true,
      get: () => false,
    },
    {
      label: "Call log retention",
      cape: "1–30 days",
      get: (c) => (!c ? "Varies" : "Kept for years"),
    },
    {
      label: "No data selling",
      cape: true,
      get: (c) =>
        !c
          ? "Varies"
          : c.slug === "usmobile" || c.slug === "mint" || c.slug === "googlefi"
            ? "MVNO (inherits)"
            : false,
    },
  ]);

  function cellDisplay(val: string | boolean): {
    text: string;
    class: string;
  } {
    if (val === true) return { text: "✓", class: "text-emerald-400" };
    if (val === false) return { text: "✗", class: "text-red-400/60" };
    if (val === "Kept for years")
      return { text: val, class: "text-red-400/60" };
    return { text: val, class: "text-white/80" };
  }

  function shouldHighlight(row: FeatureRow, carrier: Plan | null): boolean {
    const cape = row.cape;
    const other = row.get(carrier);
    if (cape === false) return false;
    if (
      other === false ||
      other === "Not included" ||
      other === "Paid add-on" ||
      other === "MVNO (inherits)" ||
      other === "Kept for years"
    )
      return true;
    // Cape has full feature (true), carrier has a limited version (string that isn't "Unlimited"/"Varies"/"X countries")
    if (
      cape === true &&
      typeof other === "string" &&
      other !== "Unlimited" &&
      other !== "Varies" &&
      !other.includes("countries")
    )
      return true;
    // Price comparison: both are price strings
    if (
      row.label === "Monthly price (per line)" &&
      typeof cape === "string" &&
      typeof other === "string"
    ) {
      const capeNum = parseFloat(cape.replace(/[^0-9.]/g, ""));
      const otherNum = parseFloat(other.replace(/[^0-9.]/g, ""));
      if (!isNaN(capeNum) && !isNaN(otherNum) && capeNum < otherNum)
        return true;
    }
    return false;
  }

  const referralSteps = $derived(
    [0, 1, 2, 3, 4].map((n) => ({
      referrals: n,
      price: Math.max(0, data.cape.pricePerLine[0] - n * 20),
    })),
  );
</script>

<svelte:head>
  <title>Cape vs Other Carriers — Plan Comparison | cape.rip</title>
  <meta
    name="description"
    content="Compare Cape Cellular pricing against T-Mobile, Verizon, Mint Mobile, US Mobile, Visible, and Google Fi. Calculate your monthly and yearly savings."
  />
  <link rel="canonical" href="https://cape.rip/compare" />
  <meta
    property="og:title"
    content="Cape vs Other Carriers — Plan Comparison | cape.rip"
  />
  <meta
    property="og:description"
    content="See how Cape stacks up on price and features. Calculate your savings switching from any major carrier."
  />
  <meta property="og:url" content="https://cape.rip/compare" />
</svelte:head>

<main class="min-h-screen">
  <section class="max-w-6xl mx-auto w-full px-6 pt-10 pb-8">
    <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
      Plan Comparison
    </h1>
    <p class="text-white/60 mt-3 text-sm leading-relaxed">
      Cape's early adopter price is <strong class="text-white"
        >${data.cape.pricePerLine[0]}/month</strong
      >, locked in permanently for anyone who joins before the end of 2026.
      Here's how it stacks up.
    </p>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <div class="bg-card border border-lavender/15 rounded-md p-5 sm:p-6">
      <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-6">
        Savings calculator
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <label class="flex flex-col gap-2">
          <span class="text-xs uppercase tracking-wider text-white/50"
            >Current carrier</span
          >
          <div class="relative">
            <select
              bind:value={selectedSlug}
              class="bg-surface border border-white/10 rounded px-4 py-3 pr-10 text-sm focus:outline-none focus:border-lavender appearance-none w-full"
            >
              {#each nonCapeCarriers as carrier}
                <option value={carrier.slug}>{carrier.name}</option>
              {/each}
              <option value="other">Other / custom amount</option>
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

        <label class="flex flex-col gap-2">
          <span class="text-xs uppercase tracking-wider text-white/50"
            >Number of lines</span
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

      {#if isCustom}
        <label class="flex flex-col gap-2 mt-4 max-w-xs">
          <span class="text-xs uppercase tracking-wider text-white/50"
            >Your monthly bill</span
          >
          <div
            class="flex items-center border border-white/10 bg-surface rounded"
          >
            <span class="pl-4 text-white/40 text-sm">$</span>
            <input
              type="number"
              bind:value={customBill}
              min="0"
              max="500"
              class="flex-1 bg-transparent px-2 py-3 text-sm focus:outline-none font-mono"
            />
          </div>
        </label>
      {/if}

      <div class="mt-8 bg-surface rounded p-6">
        <p class="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
          Cape vs {carrierName}
        </p>
        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-white/60"
              >Cape ({lines} line{lines > 1 ? "s" : ""})</span
            >
            <span class="font-mono font-bold">${capeMonthlyCost}/mo</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-white/60"
              >{carrierName} ({lines} line{lines > 1 ? "s" : ""})</span
            >
            <span class="font-mono font-bold">${carrierMonthlyCost}/mo</span>
          </div>
          <div
            class="border-t border-white/10 pt-3 flex justify-between text-sm"
          >
            <span class="text-white/60">Monthly difference</span>
            <span
              class="font-mono font-bold {monthlyDiff > 0
                ? 'text-red-400'
                : monthlyDiff < 0
                  ? 'text-emerald-400'
                  : 'text-white/60'}"
            >
              {monthlyDiff > 0
                ? `Cape costs $${monthlyDiff} more`
                : monthlyDiff < 0
                  ? `Cape saves $${Math.abs(monthlyDiff)}`
                  : "Same price"}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-white/60">Yearly difference</span>
            <span
              class="font-mono font-bold {yearlyDiff > 0
                ? 'text-red-400'
                : yearlyDiff < 0
                  ? 'text-emerald-400'
                  : 'text-white/60'}"
            >
              {yearlyDiff > 0
                ? `+$${yearlyDiff}/yr more`
                : yearlyDiff < 0
                  ? `Save $${Math.abs(yearlyDiff)}/yr`
                  : "$0/yr"}
            </span>
          </div>
        </div>

        {#if lines > 1}
          <div class="border-t border-white/10 mt-4 pt-4">
            <p class="text-xs uppercase tracking-[0.2em] text-lavender/60 mb-2">
              With referrals
            </p>
            <p class="text-xs text-white/50 mb-3">
              Each Cape line can use a referral code for $20/mo off. With {lines}
              lines, that's ${referralDiscount}/mo saved.
            </p>
            <div class="flex justify-between text-sm">
              <span class="text-white/60">Cape with referrals</span>
              <span class="font-mono font-bold text-lavender"
                >${capeWithReferrals}/mo</span
              >
            </div>
            <div class="flex justify-between text-sm mt-2">
              <span class="text-white/60">vs {carrierName}</span>
              <span
                class="font-mono font-bold {monthlyDiffWithReferrals > 0
                  ? 'text-red-400'
                  : monthlyDiffWithReferrals < 0
                    ? 'text-emerald-400'
                    : 'text-white/60'}"
              >
                {monthlyDiffWithReferrals > 0
                  ? `Still $${monthlyDiffWithReferrals}/mo more`
                  : monthlyDiffWithReferrals < 0
                    ? `Save $${Math.abs(monthlyDiffWithReferrals)}/mo`
                    : "Same price"}
              </span>
            </div>
          </div>
        {/if}
      </div>

      {#if monthlyDiff > 0}
        <p class="mt-6 text-sm text-white/50">
          Cape is ${monthlyDiff}/month more per line than {carrierName}, but you
          get IMSI rotation, SIM swap protection, SS7 lock, and private payment
          that no other carrier offers.
          {#if lines > 1}With referral codes (${referralDiscount}/mo off for {lines}
            lines), the gap drops to {monthlyDiffWithReferrals > 0
              ? `$${monthlyDiffWithReferrals}`
              : "nothing"}/mo.{/if}
        </p>
      {/if}
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
      Feature comparison
    </h2>
    <div class="bg-card rounded-md overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-white/10">
            <th
              class="px-4 sm:px-6 py-4 text-left text-xs uppercase tracking-wider text-white/40 font-medium"
            ></th>
            <th
              class="px-4 sm:px-6 py-4 text-center text-xs uppercase tracking-wider text-lavender font-semibold"
              >Cape</th
            >
            <th
              class="px-4 sm:px-6 py-4 text-center text-xs uppercase tracking-wider text-white/40 font-medium"
              >{carrierName}</th
            >
          </tr>
        </thead>
        <tbody>
          {#each featureRows as row, i}
            {@const capeVal = cellDisplay(row.cape)}
            {@const carrierVal = cellDisplay(row.get(selectedCarrier))}
            <tr
              class="{i < featureRows.length - 1
                ? 'border-b border-white/5'
                : ''} {shouldHighlight(row, selectedCarrier)
                ? 'bg-lavender/5'
                : ''}"
            >
              <td class="px-4 sm:px-6 py-3 text-white/60">
                {#if links[row.label]}
                  <a
                    href={links[row.label]}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    {row.label}
                    <CircleHelp class="w-3.5 h-3.5 text-white/25 shrink-0" />
                  </a>
                {:else}
                  {row.label}
                {/if}
              </td>
              <td class="px-4 sm:px-6 py-3 text-center {capeVal.class}">
                {#if capeVal.text === "✓"}
                  <span class="text-lg">{capeVal.text}</span>
                {:else if capeVal.text === "✗"}
                  <span class="text-lg">{capeVal.text}</span>
                {:else}
                  <span class="font-mono text-xs">{capeVal.text}</span>
                {/if}
              </td>
              <td class="px-4 sm:px-6 py-3 text-center {carrierVal.class}">
                {#if carrierVal.text === "✓"}
                  <span class="text-lg">{carrierVal.text}</span>
                {:else if carrierVal.text === "✗"}
                  <span class="text-lg">{carrierVal.text}</span>
                {:else}
                  <span class="font-mono text-xs">{carrierVal.text}</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="text-xs text-white/30 mt-2">
      Select a different carrier above to update the comparison.
      {#if selectedCarrier && !selectedCarrier.taxesIncluded}
        <span class="text-white/40"
          >* {selectedCarrier.name} prices do not include taxes and fees, which typically
          add $5–10/line. Cape's price includes all taxes and fees.</span
        >
      {/if}
    </p>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
      What no other carrier offers
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <a
        href={links["IMSI rotation"]}
        target="_blank"
        rel="noopener noreferrer"
        class="border border-white/8 rounded-md p-5 hover:bg-white/3 transition-colors block group"
      >
        <p
          class="text-sm font-semibold text-lavender mb-2 flex items-center justify-between"
        >
          IMSI Rotation
          <CircleHelp
            class="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors"
          />
        </p>
        <p class="text-xs text-white/50 leading-relaxed">
          Your IMSI ties your SIM to cell towers. Normally it never changes,
          letting anyone with tower access track your movements indefinitely.
          Cape rotates it every 24 hours and lets you trigger a manual rotation
          anytime. No other US carrier does this.
        </p>
      </a>
      <a
        href={links["SIM swap protection"]}
        target="_blank"
        rel="noopener noreferrer"
        class="border border-white/8 rounded-md p-5 hover:bg-white/3 transition-colors block group"
      >
        <p
          class="text-sm font-semibold text-lavender mb-2 flex items-center justify-between"
        >
          SIM Swap Protection
          <CircleHelp
            class="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors"
          />
        </p>
        <p class="text-xs text-white/50 leading-relaxed">
          SIM swap attacks let someone hijack your phone number by convincing
          your carrier to port it to their SIM. The big carriers offer account
          PINs, but those get bypassed through social engineering constantly.
          Cape blocks SIM swaps at the network level.
        </p>
      </a>
      <a
        href={links["SS7 network lock"]}
        target="_blank"
        rel="noopener noreferrer"
        class="border border-white/8 rounded-md p-5 hover:bg-white/3 transition-colors block group"
      >
        <p
          class="text-sm font-semibold text-lavender mb-2 flex items-center justify-between"
        >
          SS7 Network Lock
          <CircleHelp
            class="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors"
          />
        </p>
        <p class="text-xs text-white/50 leading-relaxed">
          SS7 is the protocol carriers use to route calls between networks. It
          has known vulnerabilities that allow call interception, text
          interception, and real-time location tracking. The major carriers have
          done little to fix this. Cape implements protections at the network
          level.
        </p>
      </a>
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <div class="bg-card rounded-md p-5 sm:p-6">
      <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
        Referral program
      </h2>
      <p class="text-sm text-white/60 mb-2">
        Every Cape subscriber gets a unique referral code. When someone signs up
        with your code, you both get <strong class="text-white"
          >$20/month off</strong
        > your bills. The discount is recurring and lasts as long as both accounts
        stay active.
      </p>
      <p class="text-sm text-white/50 mb-6">
        You can stack up to 5 referrals. At Cape's ${data.cape
          .pricePerLine[0]}/month rate, just 4 gets you to $0. Here's how the
        math works out:
      </p>
      <div class="flex items-end gap-2 sm:gap-4 h-48">
        {#each referralSteps as step}
          {@const maxPrice = data.cape.pricePerLine[0]}
          {@const barHeight =
            step.price === 0 ? 4 : 10 + Math.pow(step.price / maxPrice, 2) * 90}
          <div class="flex-1 flex flex-col items-center h-full">
            <div class="flex-1 w-full flex flex-col items-center justify-end">
              <span
                class="text-sm sm:text-lg font-mono font-bold mb-2 {step.referrals ===
                0
                  ? 'text-white/40'
                  : step.referrals <= 2
                    ? 'text-amber-400'
                    : step.referrals === 3
                      ? 'text-yellow-400'
                      : 'text-emerald-400'}"
              >
                {step.price === 0 ? "Free" : `$${step.price}`}
              </span>
              <div
                class="w-full max-w-16 rounded-t transition-all {step.referrals ===
                0
                  ? ''
                  : step.referrals <= 2
                    ? 'bg-amber-500/50'
                    : step.referrals === 3
                      ? 'bg-yellow-500/50'
                      : 'bg-emerald-500/40'}"
                style="height: {barHeight}%;{step.referrals === 0
                  ? ' background:repeating-linear-gradient(-45deg,transparent,transparent 3px,rgba(255,255,255,0.06) 3px,rgba(255,255,255,0.06) 6px)'
                  : ''}"
              ></div>
            </div>
            <div class="mt-3 text-center">
              <span class="text-xs text-white/40 block">
                {step.referrals === 0
                  ? "Base"
                  : `${step.referrals} ref${step.referrals > 1 ? "s" : ""}`}
              </span>
              <span
                class="text-[10px] block {step.referrals > 0
                  ? 'text-white/25'
                  : 'invisible'}"
              >
                {step.referrals > 0 ? `-$${step.referrals * 20}/mo` : "-"}
              </span>
            </div>
          </div>
        {/each}
      </div>
      <p class="text-xs text-white/30 mt-4 text-center">
        If a referral cancels their account, that $20 credit ends on your next
        billing cycle and the slot opens up for a new one.
      </p>
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
      All carrier comparisons
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each data.carriers as c}
        <a
          href="/compare/{c.slug}"
          class="border border-white/8 rounded-md p-6 hover:bg-white/3 transition-colors block group"
        >
          <h3
            class="text-sm font-semibold text-white group-hover:text-lavender transition-colors"
          >
            Cape vs {c.name}
          </h3>
          <p class="text-2xl font-mono font-bold mt-3">
            {#if c.carrier.pricePerLine[0] !== c.carrier.pricePerLine[4]}
              ${c.carrier.pricePerLine[4]}–${c.carrier.pricePerLine[0]}<span
                class="text-sm text-white/40 font-normal">/line</span
              >
            {:else}
              ${c.carrier.pricePerLine[0]}<span
                class="text-sm text-white/40 font-normal">/mo</span
              >
            {/if}
          </p>
          <p class="text-xs text-white/40 mt-1">{c.carrier.network}</p>
          <ul class="mt-4 space-y-1">
            {#each c.carrier.features as feature}
              <li class="text-xs text-white/50">{feature}</li>
            {/each}
          </ul>
          <p
            class="text-xs text-lavender mt-4 group-hover:text-lavender-bright transition-colors"
          >
            View full comparison &rarr;
          </p>
        </a>
      {/each}
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-12">
    <div
      class="bg-lavender/4 border border-lavender/15 rounded-md p-5 sm:p-6 text-center"
    >
      <p class="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
        Ready to switch?
      </p>
      <p class="text-sm text-white/60 leading-relaxed max-w-2xl mx-auto">
        Grab a referral code from the community pool and get $20/month off your
        Cape plan for as long as both accounts stay active. Stack 4 referrals
        and your $70/month plan is completely covered.
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
