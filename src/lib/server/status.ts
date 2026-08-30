// cape's status page runs on pagerduty status pages, whose own frontend reads
// these unauthenticated json endpoints, so we read the same ones:
//   /api/services   services listed on the page
//   /api/data       layout and the global status headline
//   /api/post_enums id -> name for status, severity and impact values
//   /api/posts      incident and maintenance posts, since/until in epoch ms
// a timer refreshes the snapshot so page loads never wait on the upstream

import type {
  FooterStatus,
  IncidentUpdate,
  ServiceState,
  StatusData,
  StatusIncident,
  StatusService,
} from "$lib/types";

const HOST = "https://cape-status.trust.pagerduty.com";
const REFRESH_MS = 60_000;
const MAX_INCIDENTS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_MS = 85 * DAY_MS;
const MAX_WINDOWS = 9;
const MAX_PAGES = 5;

const SEVERITY: Record<ServiceState, number> = {
  operational: 0,
  unknown: 0,
  maintenance: 1,
  degraded: 2,
  partial: 3,
  major: 4,
};

const STATE_LABELS: Record<ServiceState, string> = {
  operational: "Operational",
  maintenance: "Under maintenance",
  degraded: "Degraded performance",
  partial: "Partial outage",
  major: "Major outage",
  unknown: "Unknown",
};

const SMOOTH = /smooth|operational|all systems|no .*issues/i;

let snapshot: StatusData | null = null;
let inflight: Promise<StatusData> | null = null;
let timer: NodeJS.Timeout | null = null;

// idempotent
export function startStatusRefresh(): void {
  if (timer) return;
  timer = setInterval(() => void refresh(), REFRESH_MS);
  timer.unref?.();
  void refresh();
}

function refresh(): Promise<StatusData> {
  if (inflight) return inflight;
  inflight = (async () => {
    const data = await buildStatus();
    snapshot = data;
    return data;
  })()
    .catch(() => snapshot ?? EMPTY)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export async function getStatus(): Promise<StatusData> {
  return snapshot ?? refresh();
}

export function footerStatus(): FooterStatus {
  if (!snapshot) return { state: "unknown", label: "System status" };
  const { state, headline } = snapshot.overall;
  return {
    state,
    label:
      state === "operational"
        ? "All systems operational"
        : state === "unknown"
          ? "System status"
          : headline,
  };
}

const EMPTY: StatusData = {
  pageUrl: `${HOST}/`,
  historyUrl: `${HOST}/posts/history`,
  overall: { state: "unknown", headline: "Status temporarily unavailable" },
  services: [],
  incidents: [],
  historyAvailable: false,
  incidentsCapped: false,
};

async function buildStatus(): Promise<StatusData> {
  const [servicesJson, dataJson, enumsJson, posts] = await Promise.all([
    getJson("/api/services"),
    getJson("/api/data"),
    getJson("/api/post_enums"),
    fetchPosts(),
  ]);

  const enumName = new Map<string, string>();
  for (const e of asArray(enumsJson, "post_enums") as Record<
    string,
    string
  >[]) {
    if (e?.id) enumName.set(e.id, e.description || e.name || "");
  }

  const settings =
    (dataJson as Record<string, any> | null)?.layout?.layout_settings ?? {};
  const headline: string =
    settings.statusPage?.globalStatusHeadline || "All systems operational";

  const services: StatusService[] = asArray(servicesJson, "services")
    .map((s) => s as Record<string, unknown>)
    .filter((s) => s.is_active !== false)
    .map((s) => ({
      id: (s.id as string) ?? (s.display_name as string),
      name: (s.display_name as string) || (s.name as string) || "Service",
      state: "operational" as ServiceState,
      statusLabel: STATE_LABELS.operational,
    }));

  const serviceById = new Map(services.map((s) => [s.id, s]));

  const rawPosts = posts ?? [];
  const incidents = await Promise.all(
    rawPosts
      .slice()
      .sort((a, b) => msOf(b.first_update_at) - msOf(a.first_update_at))
      .slice(0, MAX_INCIDENTS)
      .map(async (listPost) => {
        const id = listPost.id as string | undefined;
        const detail = id
          ? ((await getJson(`/api/posts/${encodeURIComponent(id)}`)) as {
              post?: Record<string, unknown>;
            } | null)
          : null;
        const full = detail?.post;
        return normalizePost(
          full && Array.isArray(full.updates) ? full : listPost,
          enumName,
        );
      }),
  );
  incidents.sort((a, b) => timeOf(b.startedAt) - timeOf(a.startedAt));

  for (const inc of incidents) {
    const names: string[] = [];
    for (const ref of inc.affectedRefs) {
      const svc = serviceById.get(ref.id);
      if (!svc) continue;
      names.push(svc.name);
      if (!inc.resolved) {
        svc.state = worst([svc.state, ref.state]);
        svc.statusLabel = STATE_LABELS[svc.state];
      }
    }
    inc.affected = [...new Set(names)];
  }

  const headlineSmooth = SMOOTH.test(headline);
  const overallState: ServiceState = services.length
    ? worst(services.map((s) => s.state))
    : dataJson !== null
      ? headlineSmooth
        ? "operational"
        : "degraded"
      : "unknown";

  return {
    pageUrl: EMPTY.pageUrl,
    historyUrl: EMPTY.historyUrl,
    overall: {
      state: overallState,
      headline:
        overallState === "operational"
          ? "All systems operational"
          : overallState === "unknown"
            ? "Status temporarily unavailable"
            : headlineSmooth
              ? "Some systems are experiencing issues"
              : headline,
    },
    services,
    incidents: incidents.map(({ affectedRefs, ...rest }) => rest),
    historyAvailable: posts !== null,
    incidentsCapped: rawPosts.length > MAX_INCIDENTS,
  };
}

async function getJson(path: string, timeoutMs = 4000): Promise<unknown> {
  try {
    const res = await fetch(`${HOST}${path}`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function fetchPosts(): Promise<Record<string, unknown>[] | null> {
  const all: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  let until = Date.now();
  let reachedAny = false;

  for (let w = 0; w < MAX_WINDOWS && all.length < MAX_INCIDENTS; w++) {
    const since = until - WINDOW_MS;
    let token: string | null = null;

    for (let page = 0; page < MAX_PAGES; page++) {
      const json = (await getJson(
        `/api/posts?since=${since}&until=${until}` +
          (token ? `&continuation_token=${encodeURIComponent(token)}` : ""),
      )) as {
        posts?: Record<string, unknown>[];
        continuationToken?: string | null;
      } | null;
      if (!json) break;
      reachedAny = true;
      for (const post of Array.isArray(json.posts) ? json.posts : []) {
        const id = post?.id as string | undefined;
        if (id) {
          if (seen.has(id)) continue;
          seen.add(id);
        }
        all.push(post);
      }
      token = json.continuationToken ?? null;
      if (!token) break;
    }
    until = since;
  }

  return reachedAny ? all : null;
}

type RawIncident = StatusIncident & {
  affectedRefs: { id: string; state: ServiceState }[];
};

function normalizePost(
  post: Record<string, unknown>,
  enumName: Map<string, string>,
): RawIncident {
  const type = post.post_type === "maintenance" ? "maintenance" : "incident";

  const updMap = new Map<string, Record<string, unknown>>();
  for (const u of (Array.isArray(post.updates) ? post.updates : []) as Record<
    string,
    unknown
  >[]) {
    if (u?.id) updMap.set(u.id as string, u);
  }
  const latest = post.latest_update as Record<string, unknown> | undefined;
  if (latest?.id) updMap.set(latest.id as string, latest);
  const rawUpdates = [...updMap.values()];

  const updates: IncidentUpdate[] = rawUpdates
    .map((u) => ({
      message: sanitizeHtml(u.message),
      status: capitalize(enumName.get(u.status_id as string) ?? ""),
      at: msToIso(u.reported_at),
    }))
    .sort((a, b) => timeOf(b.at) - timeOf(a.at));

  const current =
    latest ??
    rawUpdates.sort((a, b) => msOf(b.reported_at) - msOf(a.reported_at))[0];
  const statusName = (
    enumName.get(current?.status_id as string) ?? ""
  ).toLowerCase();
  const resolved = statusName === "resolved" || statusName === "completed";

  const refs = new Map<string, ServiceState>();
  for (const u of rawUpdates) {
    const impacts = (Array.isArray(u.impacts) ? u.impacts : []) as Record<
      string,
      unknown
    >[];
    for (const im of impacts) {
      const sid = im.service_id as string;
      if (!sid) continue;
      const st = stateFromName(enumName.get(im.severity_id as string));
      refs.set(sid, refs.has(sid) ? worst([refs.get(sid)!, st]) : st);
    }
  }

  const oldest = updates[updates.length - 1]?.at ?? null;
  const startedAt =
    type === "maintenance"
      ? msToIso(post.starts_at) || msToIso(post.first_update_at) || oldest
      : msToIso(post.first_update_at) || msToIso(post.starts_at) || oldest;
  const resolvedAt =
    type === "maintenance"
      ? msToIso(post.ends_at) ||
        (resolved ? msToIso(post.last_update_at) : null)
      : resolved
        ? msToIso(post.last_update_at) || updates[0]?.at || null
        : null;

  return {
    id: (post.id as string) ?? `${post.title ?? "post"}-${startedAt ?? ""}`,
    title:
      (post.title as string)?.trim() ||
      (type === "maintenance" ? "Maintenance" : "Incident"),
    type,
    state:
      type === "maintenance"
        ? "maintenance"
        : resolved
          ? "operational"
          : stateFromName(enumName.get(current?.severity_id as string)),
    latestStatus:
      updates[0]?.status ||
      capitalize(statusName) ||
      (type === "maintenance" ? "Scheduled" : "Investigating"),
    resolved,
    startedAt,
    resolvedAt,
    affected: [],
    updates,
    affectedRefs: [...refs].map(([id, state]) => ({ id, state })),
  };
}

function stateFromName(name: string | null | undefined): ServiceState {
  const t = (name ?? "").toLowerCase().trim();
  if (!t || t === "all good" || t === "operational" || t === "none")
    return "operational";
  if (t.includes("maintenance")) return "maintenance";
  if (t.includes("major") || t === "outage" || t.includes("critical"))
    return "major";
  if (t.includes("partial")) return "partial";
  if (
    t.includes("minor") ||
    t.includes("degraded") ||
    t.includes("performance")
  )
    return "degraded";
  return "unknown";
}

function worst(states: ServiceState[]): ServiceState {
  return states.reduce<ServiceState>(
    (a, s) => (SEVERITY[s] > SEVERITY[a] ? s : a),
    "operational",
  );
}

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "ul",
  "ol",
  "li",
  "strong",
  "b",
  "em",
  "i",
  "a",
  "code",
  "blockquote",
  "h3",
  "h4",
]);

function sanitizeHtml(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<(script|style|iframe|object|embed|svg|math)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(\/?)([a-zA-Z0-9]+)([^>]*?)\/?>/g, (_m, slash, tag, attrs) => {
      const t = String(tag).toLowerCase();
      if (!ALLOWED_TAGS.has(t)) return "";
      if (slash) return `</${t}>`;
      if (t === "br") return "<br>";
      if (t !== "a") return `<${t}>`;
      const m = String(attrs).match(/\bhref\s*=\s*("([^"]*)"|'([^']*)')/i);
      const url = (m?.[2] ?? m?.[3] ?? "").trim();
      return /^(https?:|mailto:)/i.test(url)
        ? `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">`
        : "<a>";
    })
    .replace(/(<(?:p|li|blockquote|h3|h4)>)(?:\s|&nbsp;|<br>)+/gi, "$1")
    .replace(/(?:\s|&nbsp;|<br>)+(<\/(?:p|li|blockquote|h3|h4)>)/gi, "$1")
    .replace(/<(p|li|blockquote|h3|h4)>(?:\s|&nbsp;|<br>)*<\/\1>/gi, "")
    .replace(/^(?:\s|&nbsp;|<br>)+|(?:\s|&nbsp;|<br>)+$/gi, "")
    .trim();
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function msToIso(v: unknown): string | null {
  const ms = Number(v);
  return Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : null;
}

function msOf(v: unknown): number {
  const ms = Number(v);
  return Number.isFinite(ms) ? ms : 0;
}

function timeOf(iso: string | null): number {
  const t = iso ? Date.parse(iso) : NaN;
  return isNaN(t) ? 0 : t;
}

function asArray(json: unknown, key: string): unknown[] {
  const v = (json as Record<string, unknown> | null)?.[key];
  return Array.isArray(v) ? v : [];
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
