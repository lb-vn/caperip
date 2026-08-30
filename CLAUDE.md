# Cape

## Deployment

The Cloudflare Worker (`worker/`) is deployed separately from the main SvelteKit app. When any file in `worker/` is modified, remind the user to run `make deploy-worker` before or after deploying the main app. Changes to the SvelteKit app alone do not require a worker redeploy.

## Cape Cellular - Current Facts (as of May 2026)

### Pricing

- **$70/month** per line, all taxes and fees included. No tiers, no add-ons.
- This is the "early adopter" rate: permanent for anyone who joins before end of 2026.
- Existing customers got it automatically, no promo code needed.
- Was $99/month before the early adopter pricing.
- Referral program ($20/month off per referral, stack up to 5) still works on top of $70. Only need 4 referrals to hit $0.

### Company

- CEO: John Doyle. Testified before Congress on telecom security.
- Funding: $191M total. Series C was $100M at $900M valuation. Investors: Bain Capital Ventures, IVP, A16Z, Costanoa, Point72.
- Exited beta January 2026. Partnered with Proton at launch.
- Sponsors EFF, supports GrapheneOS (sells Pixels with GrapheneOS pre-installed for +$50).

### Network & Architecture

- Heavy MVNO: leases radio access from MNOs but runs its own cloud-based mobile core and SIM provisioning.
- Runs on both T-Mobile and AT&T's networks.
- Fully cloud-based core, no legacy SS7/Diameter infrastructure.
- CALEA-compliant (legally required for US telecom carriers).

### Privacy & Security Features

- **IMSI rotation**: rotates every 24 hours, manual rotation anytime. Defends against paging attacks and IMSI catchers.
- **SIM swap protection**: network-level blocking, not just account PINs.
- **SS7/Network lock**: blocks signaling attacks (call interception, location tracking).
- **Private payment**: tokenized via Stripe, no name required on account.
- **Disappearing call logs**: deleted after 1 day (vs years at traditional carriers).
- **Encrypted voicemail**: end-to-end, decryption key stays on device.
- **Last-mile encrypted texting**: SMS/MMS encrypted through Cape app.
- **Secondary numbers**: 2 free additional real phone numbers.
- **Secure global roaming**: 50+ countries, 5GB secure data included.
- **Encrypted push notifications**: device-only readable.

### Law Enforcement Policy

- Deletes call logs after 1 day, making most historical data requests moot.
- Notifies subscribers of legal requests before disclosure (unless legally prohibited).
- Challenges overly broad or unlawful requests.
- Encrypted voicemails handed over without decryption key (key stays on device).
- Does not collect names, SSNs, government IDs, or email addresses.

### Upcoming

- RCS and VoWiFi (works on iOS but conflicts with IMSI rotation, being fixed).
- New eSIM with expanded carrier partnerships.
- Doubled download speeds.
- International expansion planned.

### Key Blog Post URLs (for linking)

All feature blog posts follow pattern: `https://cape.co/blog/product-feature-{slug}`

- Identifier rotation: `/blog/product-feature-identifier-rotation`
- SIM swap protection: `/blog/product-feature-sim-swap-protection`
- Network lock (SS7): `/blog/product-feature-network-lock`
- Private payment: `/blog/product-feature-private-payment`
- Secondary numbers: `/blog/product-feature-secondary-numbers`
- Secure global roaming: `/blog/product-feature-secure-global-roaming`
- Encrypted voicemail: `/blog/product-feature-encrypted-voicemail`
- Disappearing call logs: `/blog/product-feature-disappearing-call-logs`
- Last-mile encrypted texting: `/blog/product-feature-last-mile-encrypted-texting`
- Encrypted push notifications: (published 06.11.25)
- Early adopter pricing: `/blog/recognizing-our-early-adopters`
