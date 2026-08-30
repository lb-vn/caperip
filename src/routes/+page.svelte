<script lang="ts">
  import { untrack } from "svelte";
  import { Copy, Check, CircleHelp } from "@lucide/svelte";
  import type { PageData } from "./$types";
  import { capeUrl } from "$lib/track";
  import { useTurnstile } from "$lib/turnstile.svelte";
  import SpeedMap from "$lib/components/SpeedMap.svelte";
  import { coverageMapUrl } from "$lib/coverage-map";
  import { CODE_LENGTH, CODE_PATTERN } from "$lib/validation";

  let { data }: { data: PageData } = $props();

  const mapUrl = coverageMapUrl(3.2);

  const siteKey = untrack(() => data.turnstileSiteKey);

  let current = $state(untrack(() => data.initial));
  let copied = $state(false);
  let helpOpen = $state(false);
  let reporting = $state(false);
  let rolling = $state(false);
  let errorMessage: string | null = $state(null);

  let modalOpen = $state(false);
  let submitValue = $state("");
  let submitError: string | null = $state(null);
  let submitSuccess = $state(false);
  let submitting = $state(false);
  let turnstileEl: HTMLDivElement | null = $state(null);
  const turnstile = useTurnstile(siteKey, () => turnstileEl);

  async function rollNext(excludeId?: number) {
    rolling = true;
    errorMessage = null;
    try {
      const query = excludeId == null ? "" : `?exclude=${excludeId}`;
      const res = await fetch(`/api/code/next${query}`);
      if (!res.ok) throw new Error();
      current = (await res.json()).code;
      copied = false;
    } catch {
      errorMessage = "could not load a code, try again";
    } finally {
      rolling = false;
    }
  }

  async function copyCode() {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.value);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      errorMessage = "clipboard blocked, select and copy manually";
    }
  }

  function useCode() {
    if (!current) return;
    const url = capeUrl("/get-cape", "referral_code", {
      referral: current.value,
    });
    window.open(url, "_blank", "noopener,noreferrer");
    fetch("/api/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ codeId: current.id }),
    }).catch(() => {});
  }

  async function reportCode() {
    if (!current || reporting) return;
    reporting = true;
    errorMessage = null;
    const reportedId = current.id;
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ codeId: reportedId }),
      });
      if (!res.ok) errorMessage = (await res.text()) || "could not report";
    } catch {
      errorMessage = "network error";
    } finally {
      reporting = false;
      await rollNext(reportedId);
    }
  }

  function openModal() {
    modalOpen = true;
    submitValue = "";
    submitError = null;
    submitSuccess = false;
    turnstile.reset();
  }

  function closeModal() {
    modalOpen = false;
    turnstile.remove();
  }

  async function submitCode(event: SubmitEvent) {
    event.preventDefault();
    submitError = null;
    const normalized = submitValue.trim().toUpperCase();
    if (!CODE_PATTERN.test(normalized)) {
      submitError = `codes are ${CODE_LENGTH} characters, letters and digits`;
      return;
    }
    if (!turnstile.canSubmit) {
      submitError = "complete the captcha";
      return;
    }
    submitting = true;
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: normalized,
          turnstileToken: turnstile.token,
        }),
      });
      if (!res.ok) {
        submitError = (await res.text()) || "submission failed";
        turnstile.reset();
        return;
      }
      submitSuccess = true;
      submitValue = "";
    } catch {
      submitError = "network error";
      turnstile.reset();
    } finally {
      submitting = false;
    }
  }

  function citySlug(city: string, state: string): string {
    return `${city.toLowerCase().replace(/\s+/g, "-")}-${state.toLowerCase()}`;
  }
</script>

<main class="min-h-screen flex flex-col">
  <section class="max-w-6xl mx-auto w-full px-6 pt-10 pb-8">
    <div class="flex flex-col lg:flex-row gap-6">
      <div
        class="lg:w-3/5 bg-card border border-lavender/15 rounded-md p-5 sm:p-6"
      >
        <div class="mb-6 flex items-baseline justify-between gap-4">
          <div class="min-w-0">
            <p
              class="text-xs uppercase mb-3 tracking-[0.2em] text-white/40 flex items-center gap-1.5"
            >
              Cape referral code
              <button
                type="button"
                onclick={() => (helpOpen = !helpOpen)}
                aria-expanded={helpOpen}
                aria-label="How the code pool works"
                class="text-white/40 hover:text-white transition-colors"
              >
                <CircleHelp class="w-3.5 h-3.5" />
              </button>
            </p>
            <p class="text-sm text-white/50">
              Enter this at signup for <span class="text-white font-medium"
                >$20/mo off</span
              >
            </p>
          </div>
          {#if data.poolAvailable}
            <p class="text-xs text-white/30 flex items-center gap-1.5 shrink-0">
              <span class="inline-block w-1.5 h-1.5 bg-emerald-400"></span>
              {data.activeCount} in pool
            </p>
          {/if}
        </div>

        {#if helpOpen}
          <div
            class="mb-6 -mt-2 rounded-md border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/55 fade-in"
          >
            <p class="text-white/70 font-medium mb-1.5">
              How the code pool works
            </p>
            <p>
              Anyone with a Cape account can submit their referral code to a
              shared pool. Visitors see one code at a time, picked at random and
              weighted so codes that have been shown less come up first. Every
              code plays by the same rules, and all of them drop out of the pool
              after a week to keep the list fresh.
            </p>
          </div>
        {/if}

        {#if current}
          <div
            class="flex items-center justify-center gap-3 sm:gap-4 my-8 fade-in"
          >
            <div
              class="code-display text-4xl sm:text-6xl md:text-7xl select-all break-all"
              aria-live="polite"
            >
              {current.value}
            </div>
            <button
              type="button"
              onclick={copyCode}
              aria-label={copied ? "Copied" : "Copy code"}
              class="text-white/40 hover:text-white/80 transition-colors p-2 shrink-0"
            >
              {#if copied}
                <Check class="w-5 h-5 sm:w-6 sm:h-6" />
              {:else}
                <Copy class="w-5 h-5 sm:w-6 sm:h-6" />
              {/if}
            </button>
          </div>

          <div class="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onclick={useCode}
              disabled={rolling}
              class="px-6 py-3 bg-lavender text-black font-semibold rounded hover:bg-lavender-bright transition-colors disabled:opacity-50"
            >
              Sign up with this code
            </button>
            <button
              type="button"
              onclick={reportCode}
              disabled={reporting || rolling}
              class="px-6 py-3 border border-white/20 text-white/80 font-medium rounded hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {reporting ? "Reporting…" : "Didn't work — next"}
            </button>
          </div>
          <p class="mt-4 text-center">
            <button
              type="button"
              onclick={openModal}
              class="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Already a Cape subscriber?
              <span class="underline">
                Submit your referral code to the pool
              </span>
            </button>
          </p>
        {:else if data.poolAvailable}
          <div class="text-center py-8">
            <p class="text-xl text-white/60">No codes available right now.</p>
            <button
              type="button"
              onclick={openModal}
              class="mt-4 px-6 py-3 bg-lavender text-black font-semibold rounded"
            >
              Submit the first one
            </button>
          </div>
        {:else}
          <div class="text-center py-8">
            <p class="text-xl text-white/60">
              Codes are temporarily unavailable.
            </p>
            <p class="text-sm text-white/40 mt-2">
              Something is wrong on our end, not with the pool. Try again in a
              moment.
            </p>
          </div>
        {/if}

        {#if errorMessage}
          <p class="mt-4 text-sm text-red-300 text-center fade-in">
            {errorMessage}
          </p>
        {/if}
      </div>

      <div class="lg:w-2/5 bg-card rounded-md flex flex-col overflow-hidden">
        <div class="px-5 pt-5 pb-3">
          <h2 class="text-xs uppercase tracking-[0.2em] text-white/40">
            Coverage checker
          </h2>
          <p class="text-xs text-white/50 mt-2 leading-relaxed">
            Cape runs on T-Mobile and AT&T.
            <a
              href="/about"
              class="text-lavender hover:text-lavender-bright transition-colors"
              >More on how Cape works &rarr;</a
            >
          </p>
        </div>
        <a
          href={capeUrl("/coverage", "home_coverage")}
          target="_blank"
          rel="noopener noreferrer"
          class="relative block flex-1 min-h-[240px] overflow-hidden group"
        >
          {#if mapUrl}
            <iframe
              src={mapUrl}
              title="Cape coverage preview"
              class="absolute inset-0 w-full h-full border-0 pointer-events-none"
              style="filter: invert(1) hue-rotate(180deg);"
              loading="lazy"
              tabindex="-1"
              aria-hidden="true"
            ></iframe>
          {/if}
          <div
            class="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors flex items-end justify-center pb-4"
          >
            <span
              class="px-5 py-2.5 bg-lavender text-black text-sm font-semibold rounded group-hover:brightness-110 transition-all"
            >
              Open coverage map &rarr;
            </span>
          </div>
        </a>
      </div>
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-card rounded-md p-6 md:col-span-2 min-w-0">
        <div class="flex items-baseline justify-between gap-4 mb-4">
          <h2 class="text-xs uppercase tracking-[0.2em] text-white/40">
            Cape speed reports
          </h2>
          <a
            href="/speeds"
            class="text-xs text-lavender hover:text-lavender-bright transition-colors shrink-0"
          >
            All speed reports &rarr;
          </a>
        </div>
        {#if data.speedCities.length > 0}
          <div class="flex flex-col sm:flex-row gap-5 items-center">
            <div class="w-full sm:w-1/2 shrink-0">
              <SpeedMap cities={data.speedCities} />
            </div>
            <div class="w-full sm:flex-1 min-w-0">
              {#each data.speedCities.slice(0, 6) as c (c.city + c.state)}
                <a
                  href="/speeds/{citySlug(c.city, c.state)}"
                  class="flex items-baseline justify-between gap-3 -mx-2 px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
                >
                  <span class="text-sm text-white/70 truncate">
                    {c.city}, {c.state}
                    <span class="text-white/35">({c.count})</span>
                  </span>
                  <span class="text-xs font-mono text-white/80 shrink-0">
                    {c.avgDown} <span class="text-white/40">Mbps</span>
                  </span>
                </a>
              {/each}
            </div>
          </div>
        {:else}
          <p class="text-sm text-white/40">
            No speed reports yet. Submit yours.
          </p>
        {/if}
      </div>

      <div class="bg-card rounded-md p-6 flex flex-col justify-between">
        <div>
          <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
            Cape plan comparison
          </h2>
          <p class="text-sm text-white/60 leading-relaxed">
            See how Cape stacks up against T-Mobile, Verizon, US Mobile, Mint,
            and more. Calculate your savings.
          </p>
        </div>
        <a
          href="/compare"
          class="mt-6 inline-block px-5 py-3 border border-white/20 text-sm font-medium rounded text-white/80 hover:bg-white/5 transition-colors text-center"
        >
          Compare plans
        </a>
      </div>
    </div>
  </section>

  <div class="max-w-6xl mx-auto w-full px-6">
    <hr class="border-white/10" />
  </div>

  <section
    class="max-w-6xl mx-auto w-full px-6 pt-8 pb-12 grid gap-4 sm:grid-cols-2"
  >
    <div class="border border-white/8 rounded-md p-5">
      <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
        What is Cape Cellular?
      </h2>
      <p class="text-sm text-white/50 leading-relaxed">
        Cape Cellular is a privacy-focused U.S. mobile carrier built to minimize
        the data the network keeps about you. It includes network-level SIM swap
        protection, signaling-attack (SS7) defense, rotating device identifiers,
        and encrypted voicemail and texting.
      </p>
      <a
        href="/about"
        class="inline-block mt-3 text-xs text-lavender hover:text-lavender-bright transition-colors"
      >
        Full rundown &rarr;
      </a>
    </div>
    <div class="border border-white/8 rounded-md p-5">
      <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
        About cape.rip
      </h2>
      <p class="text-sm text-white/50 leading-relaxed">
        cape.rip is an independent community hub for Cape Cellular users. Grab a
        referral code for $20/mo off, run real-world speed tests, compare Cape
        to other carriers, and check Cape's
        <a href="/status" class="text-lavender hover:text-lavender-bright"
          >live service status</a
        >.
      </p>
    </div>
  </section>
</main>

{#if modalOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 fade-in"
    onclick={closeModal}
    onkeydown={(e) => e.key === "Escape" && closeModal()}
    role="presentation"
  >
    <div
      class="relative bg-card border border-white/8 rounded-md max-w-md w-full p-5 sm:p-6"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-title"
      tabindex="-1"
    >
      <button
        type="button"
        onclick={closeModal}
        aria-label="Close"
        class="absolute top-4 right-4 text-white/40 hover:text-white/80 text-2xl leading-none"
      >
        &times;
      </button>

      <h2 id="submit-title" class="text-xl font-bold">
        Submit your referral code
      </h2>
      <p class="text-sm text-white/60 mt-2">
        Codes are removed after 7 days to keep things fresh and circulating, so
        you'll need to resubmit yours weekly.
      </p>

      {#if submitSuccess}
        <div
          class="mt-6 p-4 bg-emerald-500/10 border border-emerald-400/20 rounded fade-in"
        >
          <p class="text-emerald-300 font-medium">Submitted.</p>
          <p class="text-sm text-white/60 mt-1">
            Your code is in rotation. Come back next week to resubmit.
          </p>
          <button
            type="button"
            onclick={closeModal}
            class="mt-4 px-4 py-2 bg-white/10 text-white text-sm rounded hover:bg-white/15"
            >Close</button
          >
        </div>
      {:else}
        <form onsubmit={submitCode} class="mt-6 flex flex-col gap-4">
          <label class="flex flex-col gap-2">
            <span class="text-xs uppercase tracking-wider text-white/50"
              >Referral code</span
            >
            <input
              type="text"
              bind:value={submitValue}
              placeholder="8 characters, e.g. A1B2C3D4"
              autocomplete="off"
              autocapitalize="characters"
              spellcheck="false"
              class="code-display bg-surface border border-white/10 rounded px-4 py-3 text-lg uppercase tracking-widest focus:outline-none focus:border-lavender"
              oninput={(e) => {
                submitValue = (e.target as HTMLInputElement).value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, CODE_LENGTH);
              }}
            />
          </label>

          {#if siteKey}
            <div bind:this={turnstileEl}></div>
          {:else}
            <p class="text-xs text-white/40">
              Captcha not configured (dev mode).
            </p>
          {/if}

          {#if submitError}
            <p class="text-sm text-red-300">{submitError}</p>
          {/if}

          <button
            type="submit"
            disabled={submitting || !turnstile.canSubmit}
            class="px-6 py-3 bg-lavender text-black font-semibold rounded hover:bg-lavender-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>

          <p class="text-xs text-white/40 text-center">
            One submission per network per day. We hash your IP and never store
            it raw.
          </p>
        </form>
      {/if}
    </div>
  </div>
{/if}
