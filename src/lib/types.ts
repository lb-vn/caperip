export type ServiceState =
  | "operational"
  | "maintenance"
  | "degraded"
  | "partial"
  | "major"
  | "unknown";

export interface StatusService {
  id: string;
  name: string;
  state: ServiceState;
  statusLabel: string;
}

export interface IncidentUpdate {
  message: string;
  status: string;
  at: string | null;
}

export interface StatusIncident {
  id: string;
  title: string;
  type: "incident" | "maintenance";
  state: ServiceState;
  latestStatus: string;
  resolved: boolean;
  startedAt: string | null;
  resolvedAt: string | null;
  affected: string[];
  updates: IncidentUpdate[];
}

export interface StatusData {
  pageUrl: string;
  historyUrl: string;
  overall: { state: ServiceState; headline: string };
  services: StatusService[];
  incidents: StatusIncident[];
  historyAvailable: boolean;
  incidentsCapped: boolean;
}

export interface FooterStatus {
  state: ServiceState;
  label: string;
}

export interface CityStats {
  city: string;
  state: string;
  count: number;
  avgDown: number;
  avgUp: number;
  avgPing: number;
  lat: number | null;
  lng: number | null;
}

export interface Plan {
  name: string;
  slug: string;
  pricePerLine: number[];
  taxesIncluded: boolean;
  features: string[];
  network: string;
  dataNote: string;
  source: string;
}
