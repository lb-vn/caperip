<script lang="ts">
  import { page } from "$app/stores";

  const links = [
    { href: "/", label: "Codes" },
    { href: "/about", label: "About" },
    { href: "/compare", label: "Compare" },
    { href: "/speeds", label: "Speeds" },
    { href: "/status", label: "Status" },
  ];

  let menuOpen = $state(false);
</script>

<nav
  class="border-b border-white/8 bg-surface/80 backdrop-blur-sm sticky top-0 z-40"
>
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <a href="/" class="flex flex-row items-center gap-2">
      <img src="/cape.svg" alt="cape" class="size-6" />
      <span
        class="text-lg font-black tracking-tight hover:text-lavender transition-colors"
      >
        cape.rip
      </span>
    </a>

    <div class="hidden sm:flex items-center gap-6">
      {#each links as link}
        <a
          href={link.href}
          class="text-sm font-medium transition-colors {$page.url.pathname ===
            link.href ||
          ($page.url.pathname.startsWith(link.href) && link.href !== '/')
            ? 'text-white'
            : 'text-white/50 hover:text-white'}"
        >
          {link.label}
        </a>
      {/each}
    </div>

    <button
      type="button"
      class="sm:hidden text-white/60 hover:text-white p-1"
      onclick={() => (menuOpen = !menuOpen)}
      aria-label="Toggle menu"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {#if menuOpen}
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        {:else}
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        {/if}
      </svg>
    </button>
  </div>

  {#if menuOpen}
    <div
      class="sm:hidden border-t border-white/10 px-6 py-3 flex flex-col gap-2"
    >
      {#each links as link}
        <a
          href={link.href}
          class="text-sm py-1.5 {$page.url.pathname === link.href ||
          ($page.url.pathname.startsWith(link.href) && link.href !== '/')
            ? 'text-white'
            : 'text-white/50'}"
          onclick={() => (menuOpen = false)}
        >
          {link.label}
        </a>
      {/each}
    </div>
  {/if}
</nav>
