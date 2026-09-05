import { env } from "$env/dynamic/private";

const ENDPOINT = "https://api.indexnow.org/indexnow";
const ORIGIN = "https://cape.rip";

export function indexNowKey(): string | null {
  return env.INDEXNOW_KEY || null;
}

export function submitUrls(paths: string[]): void {
  const key = indexNowKey();
  if (!key || paths.length === 0) return;

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      host: new URL(ORIGIN).host,
      key,
      keyLocation: `${ORIGIN}/indexnow.txt`,
      urlList: paths.map((p) => `${ORIGIN}${p}`),
    }),
  }).catch((err) => console.error("[indexnow]", err));
}
