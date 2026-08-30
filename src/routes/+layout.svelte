<script lang="ts">
  import "../app.css";
  import Nav from "$lib/components/Nav.svelte";
  import type { Snippet } from "svelte";
  import type { LayoutData } from "./$types";
  import type { ServiceState } from "$lib/types";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const DOT: Record<ServiceState, string> = {
    operational: "bg-emerald-400",
    maintenance: "bg-sky-400",
    degraded: "bg-amber-400",
    partial: "bg-orange-400",
    major: "bg-red-400",
    unknown: "bg-white/30",
  };
</script>

<Nav />
{@render children()}
<footer class="border-t border-white/8 mt-16">
  <div
    class="max-w-6xl mx-auto px-6 py-5 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 text-xs text-white/40"
  >
    <p class="text-center sm:text-left">
      cape.rip is an independent community tool. Not affiliated with, endorsed
      by, or operated by Cape Cellular.
    </p>
    <div class="shrink-0 flex items-center gap-3">
      <a
        href="https://github.com/lb-vn/caperip"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60 hover:text-white/90 hover:border-white/20 transition-colors"
      >
        <svg
          class="w-3.5 h-3.5"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
          />
        </svg>
        Source
      </a>
      <a
        href="/status"
        class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60 hover:text-white/90 hover:border-white/20 transition-colors"
      >
        <span class="relative flex h-2 w-2">
          {#if data.footerStatus.state !== "operational"}
            <span
              class="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping {DOT[
                data.footerStatus.state
              ]}"
            ></span>
          {/if}
          <span
            class="relative inline-flex h-2 w-2 rounded-full {DOT[
              data.footerStatus.state
            ]}"
          ></span>
        </span>
        {data.footerStatus.label}
      </a>
    </div>
  </div>
</footer>
