<script lang="ts">
  import { ExternalLink } from "@lucide/svelte";
  import { capeUrl, featureUrls } from "$lib/track";

  const features = featureUrls("about_feature", {
    "IMSI rotation": "identifier-rotation",
    "SIM swap protection": "sim-swap-protection",
    "SS7 network lock": "network-lock",
    "Private payment": "private-payment",
    "Secondary numbers": "secondary-numbers",
    "Secure global roaming": "secure-global-roaming",
    "Encrypted voicemail": "encrypted-voicemail",
    "Disappearing call logs": "disappearing-call-logs",
    "Last-mile encrypted texting": "last-mile-encrypted-texting",
  });

  const PRIVACY = [
    {
      label: "IMSI rotation",
      body: "The permanent ID your SIM broadcasts to every tower it touches. Rotates every 24 hours, or manually. Breaks the identifier IMSI catchers and paging attacks rely on.",
    },
    {
      label: "SIM swap protection",
      body: "Port-outs need a 24-word BIP-39 passphrase held only on your device. Cape support cannot move your number for you, which closes the social engineering path.",
    },
    {
      label: "SS7 network lock",
      body: "SS7 and Diameter let anyone with carrier-level access intercept calls or locate a handset. Cape checks with your device before allowing an attach request from another network, and denies it if your location does not match.",
    },
    {
      label: "Disappearing call logs",
      body: "Call and text metadata is deleted after 1 day. Traditional carriers keep it for years, and it is the first thing handed over in a subpoena.",
    },
    {
      label: "Encrypted voicemail",
      body: "End-to-end encrypted. The decryption key never leaves your device, so Cape cannot read your voicemail even if compelled to hand it over.",
    },
    {
      label: "Last-mile encrypted texting",
      body: "SMS and MMS sent through the Cape app are encrypted between your phone and the network.",
    },
    {
      label: "Private payment",
      body: "Tokenized through Stripe. Cape never needs a name to bill you.",
    },
    {
      label: "Secondary numbers",
      body: "Two additional real phone numbers, free. Currently only for text, with plans to expand into calls soon.",
    },
    {
      label: "Secure global roaming",
      body: "Your traffic is routed back through Cape rather than breaking out on the local carrier, so foreign networks see less about you.",
    },
  ];

  const FINE_PRINT = [
    {
      label: "Data",
      body: "Unlimited 5G and 4G. May slow to 256 kbps after 50GB. Usually Cape does not, and the limits are still being finalized.",
    },
    {
      label: "Hotspot",
      body: "Included, throttles after 30GB.",
    },
    {
      label: "Roaming",
      body: "50+ countries, 5GB/month home-routed. Slower beyond that.",
    },
    {
      label: "eSIM only",
      body: "No physical SIM. Your phone has to support eSIM.",
    },
    {
      label: "Devices",
      body: "iPhone XR and newer. Pixel, Samsung, Motorola, OnePlus on Android 13+. GrapheneOS supported.",
    },
    {
      label: "Switching",
      body: "Port your number in or take a new one. No contract. Cape covers 60% of your first year, up to $500, against early termination fees.",
    },
    {
      label: "Price lock",
      body: "$99 list. $70 is permanent if you join before 2027.",
    },
    {
      label: "No family plans",
      body: "Referrals are the multi-line discount, and they are per line.",
    },
  ];

  const title = "What is Cape Cellular? A Plain-English TLDR | cape.rip";
  const description =
    "Cape Cellular explained: $70/month all-in, runs on T-Mobile and AT&T, IMSI rotation, SIM swap protection, SS7 lock, and no name on the account. An independent community rundown.";
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://cape.rip/about" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content="https://cape.rip/about" />
</svelte:head>

<main class="min-h-screen">
  <section class="max-w-6xl mx-auto w-full px-6 pt-10 pb-8">
    <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
      What is Cape?
    </h1>
    <p class="text-white/60 mt-4 text-sm sm:text-base leading-relaxed">
      Cape is a US mobile carrier built so the network itself knows as little
      about you as possible. Same coverage, without the identifiers, logs, and
      signaling holes that make a normal carrier account a liability.
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
      {#each [["$70/mo", "Price per line, all in"], ["T-Mobile + AT&T", "Underlying networks"], ["1 day", "Call log retention"]] as [value, label]}
        <div class="bg-card rounded-md p-4">
          <p class="font-mono font-bold text-lg text-lavender">{value}</p>
          <p class="text-xs text-white/40 mt-1">{label}</p>
        </div>
      {/each}
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <div class="bg-card rounded-md p-6">
      <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
        TLDR
      </h2>
      <ul class="space-y-2.5 text-sm text-white/70 leading-relaxed">
        {#each ["One plan, no tiers, no add-ons, no contract.", "Unlimited talk, text, and 5G data. Hotspot and 50+ country roaming included.", "eSIM only. iPhone XR and newer, or Android 13+ including GrapheneOS.", "Identifier rotation lets you rotate your SIM's IMSI every 24 hours.", "SIM swaps are blocked in the network, not by an account PIN.", "No name, SSN, government ID, or email required to open an account.", "Every referral is $20/mo off. Four of them and you pay nothing."] as point}
          <li class="flex gap-3">
            <span class="text-lavender shrink-0">&middot;</span>
            <span>{point}</span>
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
      What you get
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each PRIVACY as f}
        <a
          href={features[f.label]}
          target="_blank"
          rel="noopener noreferrer"
          class="border border-white/8 rounded-md p-5 block hover:bg-white/3 transition-colors group"
        >
          <p
            class="text-sm font-semibold text-lavender mb-2 flex items-center justify-between gap-2"
          >
            {f.label}
            <ExternalLink
              class="w-3.5 h-3.5 text-white/25 shrink-0 group-hover:text-white/50 transition-colors"
            />
          </p>
          <p class="text-xs text-white/50 leading-relaxed">{f.body}</p>
        </a>
      {/each}
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <div class="bg-card rounded-md p-6">
      <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
        External audit
      </h2>
      <div class="space-y-3 text-sm text-white/60 leading-relaxed">
        <p>
          In May and July 2026, Cape hired <strong class="text-white"
            >Trail of Bits</strong
          > to audit its Disappearing Call Logs claims.
        </p>
        <p>
          They found that Cape stored daily usage totals in pseudo-anonymous
          form, and that an internal adversary with database access could link
          them back to individual subscribers. Not a break of the call log
          deletion itself, but a weaker guarantee than the docs implied.
        </p>
        <p>
          Cape now deletes daily totals older than 60 days, and corrected the
          docs to stop calling that storage anonymous. Published August 2026.
        </p>
      </div>
      <div class="flex flex-wrap gap-3 mt-5">
        <a
          href="https://github.com/trailofbits/publications/blob/master/reviews/cape-claimsverification-letterofattestation.pdf"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 px-5 py-2.5 border border-white/20 text-sm font-medium rounded text-white/80 hover:bg-white/5 transition-colors"
        >
          Read the attestation
          <ExternalLink class="w-3.5 h-3.5 text-white/40" />
        </a>
        <a
          href={capeUrl("/blog/disappearing-call-logs-audit", "about_audit")}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 px-5 py-2.5 border border-white/20 text-sm font-medium rounded text-white/80 hover:bg-white/5 transition-colors"
        >
          Cape's writeup
          <ExternalLink class="w-3.5 h-3.5 text-white/40" />
        </a>
      </div>
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
      Plan details
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each FINE_PRINT as item}
        <div class="border border-white/8 rounded-md p-5">
          <p class="text-sm font-semibold text-white mb-2">{item.label}</p>
          <p class="text-xs text-white/50 leading-relaxed">{item.body}</p>
        </div>
      {/each}
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-card rounded-md p-6">
        <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
          When law enforcement asks
        </h2>
        <ul class="space-y-2.5 text-sm text-white/60 leading-relaxed">
          {#each ["Call logs are deleted after 1 day, so most historical requests find nothing.", "You are notified before disclosure, unless Cape is legally barred from telling you.", "Overly broad or unlawful requests are challenged.", "Encrypted voicemail is handed over without the key, which Cape never has.", "No name, SSN, ID, or email on file to hand over."] as point}
            <li class="flex gap-3">
              <span class="text-lavender shrink-0">&middot;</span>
              <span>{point}</span>
            </li>
          {/each}
        </ul>
        <p class="text-xs text-white/40 leading-relaxed mt-4">
          Cape is CALEA-compliant, as US carriers must be. The protection is
          holding less data, not refusing lawful process.
        </p>
      </div>

      <div class="bg-card rounded-md p-6">
        <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
          Who is behind it
        </h2>
        <dl class="space-y-3 text-sm">
          {#each [["CEO", "John Doyle"], ["Funding", "$191M total, most recently a $100M Series C at a $900M valuation"], ["Investors", "Bain Capital Ventures, IVP, A16Z, Costanoa, Point72"], ["Launched", "Exited beta January 2026, partnered with Proton at launch"], ["Donates to", "The EFF, GrapheneOS ($100,000 over the next year), and Privacy Guides"]] as [term, def]}
            <div>
              <dt class="text-xs uppercase tracking-wider text-white/35">
                {term}
              </dt>
              <dd class="text-white/65 leading-relaxed mt-0.5">{def}</dd>
            </div>
          {/each}
        </dl>
      </div>
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <h2 class="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
      Where to go next
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each [{ href: "/", label: "Referral codes", body: "$20/mo off. No account needed.", external: false }, { href: "/speeds", label: "Speed tests", body: "Real user speed tests, by city.", external: false }, { href: "/compare", label: "Compare carriers", body: "Cape vs Verizon, T-Mobile, Mint, and more.", external: false }, { href: "/status", label: "Service status", body: "Network and app status, tracked independently.", external: false }, { href: capeUrl("/", "about_links"), label: "cape.co", body: "Official site. Sign up here.", external: true }, { href: "https://www.reddit.com/r/CapeCellular/", label: "r/CapeCellular", body: "Official subreddit. User reports and answers.", external: true }, { href: capeUrl("/coverage", "about_links"), label: "Coverage map", body: "Cape's official coverage map.", external: true }, { href: capeUrl("/faqs", "about_links"), label: "Cape's FAQ", body: "Billing, porting, and devices.", external: true }] as link}
        <a
          href={link.href}
          target={link.external ? "_blank" : undefined}
          rel={link.external ? "noopener noreferrer" : undefined}
          class="border border-white/8 rounded-md p-5 hover:bg-white/3 transition-colors block group"
        >
          <p
            class="text-sm font-semibold text-white group-hover:text-lavender transition-colors flex items-center justify-between gap-2"
          >
            {link.label}
            {#if link.external}
              <ExternalLink class="w-3.5 h-3.5 text-white/25 shrink-0" />
            {/if}
          </p>
          <p class="text-xs text-white/50 leading-relaxed mt-2">{link.body}</p>
        </a>
      {/each}
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-12">
    <div
      class="bg-lavender/4 border border-lavender/15 rounded-md p-5 sm:p-6 text-center"
    >
      <p class="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
        Worth it?
      </p>
      <p class="text-sm text-white/60 leading-relaxed max-w-2xl mx-auto">
        Your phone number is the recovery method for your email and your bank,
        which makes the carrier holding it part of your threat model. Cape is
        $70/month, or $0 with four referrals.
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
