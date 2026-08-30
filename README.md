# cape.rip

An independent community hub for [Cape Cellular](https://cape.co) users: a referral-code pool, crowdsourced speed tests, carrier comparisons, and a live mirror of Cape's service status.

Not affiliated with, endorsed by, or operated by Cape Cellular.

## What it does

- **Codes** — anyone can submit their referral code to a shared pool. Visitors see one at a time, picked at random and weighted by how often each has been shown, so less-seen codes come up first. Every code expires after 7 days.
- **Speeds** — runs a real download/upload/latency test against a Cloudflare Worker that only answers requests originating on Cape's network. Results are signed by the worker so the browser can't fabricate numbers.
- **Compare** — pricing and feature comparison against the major US carriers.
- **Status** — mirrors Cape's PagerDuty status page. A snapshot refreshes on a timer in the background, so pages are served from cache.
- **About** — a plain-English rundown of what Cape is, what it costs, and what the privacy features actually do.

## Stack

- SvelteKit 2 (Svelte 5 runes)
- Tailwind 4
- Postgres via Drizzle
- Cloudflare Worker for speed tests

## Development

Requires Node 22+ and Docker.

```sh
cp .env.example .env
openssl rand -hex 32   # put this in IP_HASH_SECRET
openssl rand -hex 32   # and this in COOKIE_SECRET
npm install
make up-dev            # starts Postgres in Docker, then the dev server
```

`make check` runs the formatter and type checker.

## Schema changes

`src/lib/server/db/schema.ts` is the source of truth. Migrations are generated from it and applied on boot.

```sh
# 1. edit src/lib/server/db/schema.ts
npm run db:generate    # writes drizzle/NNNN_name.sql
# 2. commit the migration with the schema change, then deploy
```

The app runs pending migrations on the first request after a cold start. To apply them by hand instead, `DATABASE_URL=... npm run db:migrate`.

Speed tests need the Cloudflare Worker in `worker/`, so they are hidden unless `PUBLIC_SPEEDTEST_URL` points at a deployed one. Everything else works without it. The worker also refuses any request that doesn't originate on Cape's network, so the test itself can only be exercised from a Cape connection.

## Privacy

No accounts, no analytics, no third-party trackers. IP addresses are only ever stored as an HMAC-SHA256 hash, used for rate limiting and de-duplication. Codes and rate-limit events are deleted after 7 days.

## License

MIT
