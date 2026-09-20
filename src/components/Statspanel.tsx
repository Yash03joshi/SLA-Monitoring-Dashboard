"use client";

import { useEffect, useState } from "react";
import {
  fetchStats,
  formatDuration,
  formatLatency,
  formatPercent,
} from "../lib/api";
import { DateFilter, ServiceRef, StatsResponse } from "../types/Monitoring";

interface Props {
  dateFilter: DateFilter;
  refreshKey: number;
  onServices: (services: ServiceRef[]) => void;
}

function resolveRange(filter: DateFilter): { from?: string; to?: string } {
  if (filter.mode === "single") return { from: filter.date, to: filter.date };
  if (filter.mode === "range") return { from: filter.from, to: filter.to };
  return {};
}

export default function StatsPanel({
  dateFilter,
  refreshKey,
  onServices,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { from, to } = resolveRange(dateFilter);
    if (dateFilter.mode === "single" && !dateFilter.date) return;
    if (dateFilter.mode === "range" && (!dateFilter.from || !dateFilter.to))
      return;

    let cancelled = false;
    setLoading(true);
    fetchStats({ from, to })
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          setError(res.error ?? "Failed to load stats.");
          return;
        }
        setError(null);
        setData(res);
        onServices(res.services.map((s) => ({ id: s.id, name: s.name })));
      })
      .catch(() => !cancelled && setError("Failed to load stats."))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, refreshKey]);

  const overview = data?.overview;

  const kpis = overview
    ? [
        {
          label: "Availability",
          value: formatPercent(overview.availability, 3),
        },
        { label: "Total checks", value: overview.totalChecks.toLocaleString() },
        { label: "Avg latency", value: formatLatency(overview.averageLatency) },
        { label: "P95 latency", value: formatLatency(overview.p95Latency) },
        { label: "Incidents", value: String(overview.incidentCount) },
        {
          label: "Downtime",
          value: formatDuration(overview.totalDowntimeMinutes),
        },
      ]
    : [];

  return (
    <section className="border border-[#DEE3E1] bg-white">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <h2 className="text-sm font-semibold tracking-tight text-[#131718]">
          Stats
        </h2>
        <span className="font-mono text-xs text-[#8A8F8C]">
          {collapsed ? "expand +" : "collapse −"}
        </span>
      </button>

      {!collapsed && (
        <div className="border-t border-[#E3E6E4] px-5 pb-5">
          {loading && <p className="pt-4 text-xs text-[#8A8F8C]">Loading…</p>}
          {error && <p className="pt-4 text-xs text-[#C24444]">{error}</p>}

          {!loading && !error && overview && (
            <>
              <div className="grid grid-cols-2 gap-y-4 pt-4 sm:grid-cols-3 lg:grid-cols-6">
                {kpis.map((k, i) => (
                  <div
                    key={k.label}
                    className={`pr-4 ${i > 0 ? "sm:border-l sm:border-[#E3E6E4] sm:pl-4" : ""}`}
                  >
                    <div className="font-mono text-xl tabular-nums text-[#131718]">
                      {k.value}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#5B6663]">
                      {k.label}
                    </div>
                  </div>
                ))}
              </div>

              {data && data.services.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-140 text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E3E6E4] text-[#8A8F8C]">
                        <th className="py-2 font-medium">Service</th>
                        <th className="py-2 font-medium text-right">Checks</th>
                        <th className="py-2 font-medium text-right">
                          Availability
                        </th>
                        <th className="py-2 font-medium text-right">
                          Avg latency
                        </th>
                        <th className="py-2 font-medium text-right">P95</th>
                        <th className="py-2 font-medium text-right">Down</th>
                        <th className="py-2 font-medium text-right">
                          Degraded
                        </th>
                      </tr>
                    </thead>
                    <tbody className="font-mono tabular-nums">
                      {data.services.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b border-[#F0F2F1] text-black"
                        >
                          <td className="py-2 font-sans">{s.name}</td>
                          <td className="py-2 text-right">{s.totalChecks}</td>
                          <td className="py-2 text-right">
                            {formatPercent(s.availability)}
                          </td>
                          <td className="py-2 text-right">
                            {formatLatency(s.averageLatency)}
                          </td>
                          <td className="py-2 text-right">
                            {formatLatency(s.p95Latency)}
                          </td>
                          <td className="py-2 text-right text-[#C24444]">
                            {s.failedChecks}
                          </td>
                          <td className="py-2 text-right text-[#C08A2E]">
                            {s.degradedChecks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
