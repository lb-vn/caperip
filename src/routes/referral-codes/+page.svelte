<script lang="ts">
  import { capeUrl } from "$lib/track";

  const title = "How Cape Cellular Referral Codes Work | cape.rip";
  const description =
    "What a Cape Cellular referral code does, how the $20/mo discount stacks to $0, why codes stop working, and where to get one that still works.";

  const FAQ = [
    {
      q: "What is a Cape Cellular referral code?",
      a: "An 8-character code tied to an existing Cape subscriber. Enter one when you sign up and both of you get $20/month off, for as long as you both stay subscribed. It is not a one-off promo credit.",
    },
    {
      q: "How much does a referral code save me?",
      a: "$20/month off, permanently. Cape is $70/month all-in, and that early adopter rate is locked for life if you join before the end of 2026. A referral code takes $20 off it, so you land at $50/month.",
    },
    {
      q: "Can I get Cape for free with referral codes?",
      a: "Yes. Referrals stack up to five, at $20/month each. Four referrals cancel out the $70/month early adopter rate entirely, so your plan costs $0/month while those referrals stay active.",
    },
    {
      q: "Where do I enter the referral code?",
      a: "At signup on cape.co. There is a referral code field during checkout. It cannot be added retroactively once your account exists, so use one the first time.",
    },
    {
      q: "Why do some Cape referral codes stop working?",
      a: "A code stops paying out once its owner reaches five active referrals, and it stops working entirely if that person cancels their line. Codes shared in old forum or Reddit posts are frequently dead for this reason.",
    },
    {
      q: "Is it safe to use a stranger's referral code?",
      a: "The code carries no personal information and gives the referrer nothing but the discount. They cannot see your name, number, or account. Cape does not collect your name at signup either.",
    },
    {
      q: "How does the cape.rip code pool work?",
      a: "Anyone with a Cape account can submit their code. Visitors are shown one at a time, picked at random and weighted so codes shown less often come up first. Every code expires after 7 days, so the pool stays current instead of filling with dead codes.",
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "cape.rip",
            item: "https://cape.rip/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "How Cape referral codes work",
          },
        ],
      },
    ],
  };
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://cape.rip/referral-codes" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content="https://cape.rip/referral-codes" />
  <meta property="og:type" content="article" />
  {@html `<script type="application/ld+json">${JSON.stringify(schema)}</script>`}
</svelte:head>

<main class="min-h-screen">
  <section class="max-w-6xl mx-auto w-full px-6 pt-10 pb-8">
    <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
      How Cape Cellular referral codes work
    </h1>
    <p
      class="text-white/60 mt-4 text-sm sm:text-base leading-relaxed max-w-3xl"
    >
      A Cape referral code takes <strong class="text-white">$20/month</strong> off
      your bill for as long as you stay subscribed, and it does the same for the person
      whose code you used. Stack four and a Cape plan costs nothing. Here is exactly
      how that works, and why so many codes you find elsewhere are already dead.
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
      {#each [["$20/mo", "Off, per referral"], ["5", "Referrals stack, max"], ["$0/mo", "Cape plan at 4 referrals"]] as [value, label]}
        <div class="bg-card rounded-md p-4">
          <p class="font-mono font-bold text-lg text-lavender">{value}</p>
          <p class="text-xs text-white/40 mt-1">{label}</p>
        </div>
      {/each}
    </div>

    <div class="flex flex-wrap gap-3 mt-8">
      <a
        href="/"
        class="px-5 py-2.5 bg-lavender text-black text-sm font-semibold rounded hover:bg-lavender-bright transition-colors"
      >
        Get a working referral code
      </a>
      <a
        href={capeUrl("/referrals", "referral_codes_page")}
        target="_blank"
        rel="noopener noreferrer"
        class="px-5 py-2.5 border border-white/20 text-sm font-medium rounded text-white/80 hover:bg-white/5 transition-colors"
      >
        Cape's official referral terms
      </a>
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <div class="bg-card rounded-md p-6">
      <h2 class="text-xs uppercase tracking-[0.2em] text-white/55 mb-4">
        The math
      </h2>
      <ul class="space-y-2.5 text-sm text-white/70 leading-relaxed">
        {#each ["Cape is $70/month with taxes and fees included. Join before the end of 2026 and that rate is locked for life.", "A referral code takes another $20/month off, so you land at $50/month.", "Each additional person who signs up with your code takes another $20/month off, up to five.", "Four referrals cover the whole $70, so the plan is $0/month while they stay active.", "Taxes and fees are already included in Cape's price, so these are out-the-door numbers."] as point}
          <li class="flex gap-3">
            <span class="text-lavender shrink-0">&middot;</span>
            <span>{point}</span>
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-8">
    <h2 class="text-xs uppercase tracking-[0.2em] text-white/55 mb-4">
      Common questions
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each FAQ as item}
        <div class="border border-white/8 rounded-md p-5">
          <h3 class="text-sm font-semibold text-lavender mb-2">{item.q}</h3>
          <p class="text-xs text-white/50 leading-relaxed">{item.a}</p>
        </div>
      {/each}
    </div>
  </section>

  <section class="max-w-6xl mx-auto w-full px-6 pb-12">
    <div
      class="bg-lavender/4 border border-lavender/15 rounded-md p-5 sm:p-6 text-center"
    >
      <p class="text-xs uppercase tracking-[0.2em] text-white/55 mb-3">
        Ready?
      </p>
      <p class="text-sm text-white/60 leading-relaxed max-w-2xl mx-auto">
        The pool on the homepage only holds codes submitted in the last 7 days,
        so what you get is current rather than scraped from a year-old thread.
        No account needed to take one.
      </p>
      <a
        href="/"
        class="mt-6 inline-block px-6 py-3 bg-lavender text-black font-semibold rounded hover:bg-lavender-bright transition-colors"
      >
        Get a Cape referral code
      </a>
    </div>
  </section>
</main>
