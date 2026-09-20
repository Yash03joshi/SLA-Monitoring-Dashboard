"use client";

import { DateFilter } from "../types/Monitoring";

interface Props {
  value: DateFilter;
  onChange: (value: DateFilter) => void;
}

export default function DateFilterBar({ value, onChange }: Props) {
  const mode = value.mode;

  function setMode(next: "single" | "range" | "none") {
    if (next === "single") onChange({ mode: "single", date: "" });
    else if (next === "range") onChange({ mode: "range", from: "", to: "" });
    else onChange({ mode: "none" });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border border-[#DEE3E1] bg-white px-4 py-3">
      <span className="text-xs font-medium text-[#5B6663]">Window</span>

      <div className="flex border border-[#C7CDCA] text-xs">
        {(["none", "single", "range"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 ${
              mode === m ? "bg-[#131718] text-white" : "bg-white text-[#5B6663]"
            } ${m !== "none" ? "border-l border-[#C7CDCA]" : ""}`}
          >
            {m === "none"
              ? "All time"
              : m === "single"
                ? "Single date"
                : "Date range"}
          </button>
        ))}
      </div>

      {mode === "single" && (
        <input
          type="date"
          value={value.date}
          onChange={(e) => onChange({ mode: "single", date: e.target.value })}
          className="border border-[#C7CDCA] px-2 py-1.5 font-mono text-xs"
        />
      )}

      {mode === "range" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.from}
            onChange={(e) =>
              onChange({ mode: "range", from: e.target.value, to: value.to })
            }
            className="border border-[#C7CDCA] px-2 py-1.5 font-mono text-xs"
          />
          <span className="text-xs text-[#5B6663]">to</span>
          <input
            type="date"
            value={value.to}
            onChange={(e) =>
              onChange({ mode: "range", from: value.from, to: e.target.value })
            }
            className="border border-[#C7CDCA] px-2 py-1.5 font-mono text-xs"
          />
        </div>
      )}

      <span className="ml-auto text-[11px] text-[#8A8F8C]">
        Applies to the stats below and the logs table. All timestamps UTC.
      </span>
    </div>
  );
}
