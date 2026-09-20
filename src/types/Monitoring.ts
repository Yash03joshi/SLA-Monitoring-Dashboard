export type CheckStatus = "UP" | "DOWN" | "DEGRADED" | "UNKNOWN";
export type IncidentStatus = "OPEN" | "RESOLVED";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ServiceRef {
  id: string;
  name: string;
}

export interface MonitoringCheck {
  id: string;
  serviceId: string;
  timestamp: string;
  statusCode: number;
  latencyMs: number | null;
  status: CheckStatus;
  agent: string;
  region: string;
  createdAt: string;
  service: ServiceRef;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LogsResponse {
  success: boolean;
  data: MonitoringCheck[];
  pagination: Pagination;
  error?: string;
}

export interface ServiceStats {
  id: string;
  name: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  degradedChecks: number;
  availability: number; // percent, e.g. 99.873
  averageLatency: number; // ms
  p95Latency: number; // ms
}

export interface Incident {
  id: string;
  serviceId: string;
  startedAt: string;
  resolvedAt: string | null;
  status: IncidentStatus;
  severity: Severity;
  durationMin: number | null;
}

export interface StatsOverview {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  degradedChecks: number;
  unknownChecks: number;
  availability: number;
  averageLatency: number;
  p95Latency: number;
  incidentCount: number;
  totalDowntimeMinutes: number;
}

export interface StatsResponse {
  success: boolean;
  overview: StatsOverview;
  services: ServiceStats[];
  incidents: Incident[];
  error?: string;
}

export interface UploadSummary {
  totalRows: number;
  insertedRows: number;
  rejectedRows: number;
  services: number;
}

export interface UploadResponse {
  success: boolean;
  uploadId?: string;
  summary?: UploadSummary;
  errors?: string[];
  totalRows?: number;
  invalidRows?: number;
  error?: string;
}

// Resolved shape of "a single date OR a date range" — only one branch is set.
export type DateFilter =
  | { mode: "single"; date: string }
  | { mode: "range"; from: string; to: string }
  | { mode: "none" };
