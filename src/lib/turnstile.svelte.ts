import { onMount, onDestroy } from "svelte";

export function useTurnstile(
  siteKey: string | undefined,
  getEl: () => HTMLDivElement | null,
) {
  let token = $state<string | null>(null);
  let widgetId: string | null = null;
  let ready = $state(false);

  function loadScript() {
    if (!siteKey) return;
    if (window.turnstile) {
      ready = true;
      return;
    }

    const existing = document.getElementById("cf-turnstile-script");
    if (existing) {
      existing.addEventListener("load", () => {
        ready = true;
      });
      return;
    }

    const s = document.createElement("script");
    s.id = "cf-turnstile-script";
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.defer = true;
    s.dataset.cfasync = "false";
    s.onload = () => {
      ready = true;
    };
    document.head.appendChild(s);
  }

  function render() {
    const el = getEl();
    if (!siteKey || !el || !ready || !window.turnstile) return;
    if (widgetId) return;

    widgetId = window.turnstile.render(el, {
      sitekey: siteKey,
      theme: "dark",
      callback: (t: string) => {
        token = t;
      },
      "expired-callback": () => {
        token = null;
      },
      "timeout-callback": () => {
        token = null;
      },
      "error-callback": () => {
        token = null;
      },
    });
  }

  function reset() {
    if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
    token = null;
  }

  function remove() {
    if (widgetId && window.turnstile) {
      window.turnstile.remove(widgetId);
      widgetId = null;
    }
    token = null;
  }

  onMount(loadScript);
  onDestroy(remove);

  $effect(render);

  return {
    get token() {
      return token;
    },
    get ready() {
      return ready;
    },
    get canSubmit() {
      return !siteKey || !!token;
    },
    reset,
    remove,
  };
}
