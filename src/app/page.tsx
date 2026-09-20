"use client";

import { useState } from "react";
import UploadPanel from "../components/Uploadpanel";
import DateFilterBar from "../components/Datefilterbar";
import StatsPanel from "../components/Statspanel";
import LogsPanel from "../components/Logspanel";
import { DateFilter, ServiceRef } from "../types/Monitoring";

export default function Page() {
  const [dateFilter, setDateFilter] = useState<DateFilter>({ mode: "none" });
  const [serviceOptions, setServiceOptions] = useState<ServiceRef[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="min-h-screen bg-[#F4F6F7] pb-16">
      <div className="mx-auto max-w-6xl px-6 pt-10">
        <header className="mb-8">
          <h1 className="text-lg font-semibold tracking-tight text-[#131718]">
            SLA Monitoring
          </h1>
          <p className="mt-1 text-sm text-[#5B6663]">
            Upload a check log, then review availability and the underlying
            records below.
          </p>
        </header>

        <div className="flex flex-col gap-5">
          <UploadPanel onUploaded={() => setRefreshKey((k) => k + 1)} />

          <DateFilterBar value={dateFilter} onChange={setDateFilter} />

          <StatsPanel
            dateFilter={dateFilter}
            refreshKey={refreshKey}
            onServices={setServiceOptions}
          />

          <LogsPanel
            dateFilter={dateFilter}
            serviceOptions={serviceOptions}
            refreshKey={refreshKey}
          />
        </div>
      </div>
    </main>
  );
}
