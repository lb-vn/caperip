import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const TURNSTILE = "https://challenges.cloudflare.com";

const speedtest = process.env.PUBLIC_SPEEDTEST_URL
  ? new URL(process.env.PUBLIC_SPEEDTEST_URL).origin
  : "https://*.cape.rip";

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    csp: {
      directives: {
        "default-src": ["self"],
        "script-src": ["self", TURNSTILE],
        "style-src": ["self", "unsafe-inline"],
        "img-src": ["self", "data:"],
        "font-src": ["self"],
        "connect-src": ["self", speedtest],
        "frame-src": [TURNSTILE],
        "frame-ancestors": ["self"],
        "form-action": ["self"],
        "base-uri": ["self"],
        "object-src": ["none"],
      },
    },
  },
};
