"use client";

import { useEffect, useState } from "react";
import StatusBadge from "./Statusbadge";
import { DateFilter, LogsResponse, ServiceRef } from "../types/Monitoring";
import { fetchLogs, formatDateTime, formatLatency } from "../lib/api";

interface Props {
  dateFilter: DateFilter;
  serviceOptions: ServiceRef[];
  refreshKey: number;
}

const LIMIT = 50;

export default function LogsPanel({
  dateFilter,
  serviceOptions,
  refreshKey,
}: Props) {
  const [serviceId, setServiceId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Any filter change resets to page 1.
  useEffect(() => {
    setPage(1);
  }, [dateFilter, serviceId, status]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const base =
      dateFilter.mode === "single"
        ? { date: dateFilter.date || undefined }
        : dateFilter.mode === "range"
          ? {
              from: dateFilter.from || undefined,
              to: dateFilter.to || undefined,
            }
          : {};

    fetchLogs({
      ...base,
      serviceId: serviceId || undefined,
      status: status || undefined,
      page,
      limit: LIMIT,
    })
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          setError(res.error ?? "Failed to load logs.");
          return;
        }
        setError(null);
        setData(res);
      })
      .catch(() => !cancelled && setError("Failed to load logs."))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [dateFilter, serviceId, status, page, refreshKey]);

  return (
    <section className="border border-[#DEE3E1] bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E3E6E4] px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight text-[#131718]">
          Logs
        </h2>

        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="ml-auto border border-[#C7CDCA] px-2 py-1.5 text-xs"
        >
          <option value="">All services</option>
          {serviceOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-[#C7CDCA] px-2 py-1.5 text-xs"
        >
          <option value="">All statuses</option>
          <option value="UP">Up</option>
          <option value="DOWN">Down</option>
          <option value="DEGRADED">Degraded</option>
          <option value="UNKNOWN">Unknown</option>
        </select>

        {(serviceId || status) && (
          <button
            onClick={() => {
              setServiceId("");
              setStatus("");
            }}
            className="text-xs text-[#5B6663] underline underline-offset-2"
          >
            Clear
          </button>
        )}
      </div>

      {loading && <p className="px-5 py-6 text-xs text-[#8A8F8C]">Loading…</p>}
      {error && <p className="px-5 py-6 text-xs text-[#C24444]">{error}</p>}

      {!loading && !error && data && data.data.length === 0 && (
        <p className="px-5 py-8 text-center text-xs text-[#8A8F8C]">
          No checks match these filters.
        </p>
      )}

      {!loading && !error && data && data.data.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-xs">
              <thead>
                <tr className="border-b border-[#E3E6E4] text-[#8A8F8C]">
                  <th className="px-5 py-2 font-medium">Timestamp</th>
                  <th className="py-2 font-medium">Service</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Code</th>
                  <th className="py-2 font-medium text-right">Latency</th>
                  <th className="py-2 font-medium">Agent</th>
                  <th className="py-2 font-medium">Region</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.id} className="border-b border-[#F0F2F1]">
                    <td className="px-5 py-2 font-mono text-[11px] text-black">
                      {formatDateTime(row.timestamp)}
                    </td>
                    <td className="py-2">
                      {row.service?.name ?? row.serviceId}
                    </td>
                    <td className="py-2">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-2 text-right font-mono">
                      {row.statusCode}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {formatLatency(row.latencyMs)}
                    </td>
                    <td className="py-2 font-mono text-[11px]">{row.agent}</td>
                    <td className="py-2 font-mono text-[11px]">{row.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#E3E6E4] px-5 py-3 text-xs text-[#5B6663]">
            <span>
              {data.pagination.total.toLocaleString()} checks · page{" "}
              {data.pagination.page} of {data.pagination.totalPages || 1}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="border border-[#C7CDCA] px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() =>
                  setPage((p) =>
                    Math.min(data.pagination.totalPages || 1, p + 1),
                  )
                }
                disabled={page >= (data.pagination.totalPages || 1)}
                className="border border-[#C7CDCA] px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
