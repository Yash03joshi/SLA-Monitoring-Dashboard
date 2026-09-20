import {
  LogsResponse,
  StatsResponse,
  UploadResponse,
} from "../types/Monitoring";

type QueryValue = string | number | undefined;

function buildQuery<T extends object>(params: T): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface LogsQuery {
  date?: string;
  from?: string;
  to?: string;
  serviceId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function fetchLogs(query: LogsQuery): Promise<LogsResponse> {
  const res = await fetch(`/api/logs${buildQuery(query)}`, {
    cache: "no-store",
  });
  return res.json();
}

export interface StatsQuery {
  from?: string;
  to?: string;
}

export async function fetchStats(query: StatsQuery): Promise<StatsResponse> {
  const res = await fetch(`/api/stats${buildQuery(query)}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function uploadCsv(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export function formatLatency(ms: number | null): string {
  if (ms === null || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return (
    d.toLocaleString("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " UTC"
  );
}

export function formatDuration(min: number | null): string {
  if (min === null || Number.isNaN(min)) return "—";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatPercent(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`;
}
