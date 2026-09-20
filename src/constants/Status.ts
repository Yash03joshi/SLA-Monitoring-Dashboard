import { CheckStatus, Severity } from "../types/Monitoring";

export const STATUS_STYLES: Record<
  CheckStatus,
  { dot: string; text: string; label: string }
> = {
  UP: { dot: "#0E7C7B", text: "text-[#0E7C7B]", label: "Up" },
  DOWN: { dot: "#C24444", text: "text-[#C24444]", label: "Down" },
  DEGRADED: { dot: "#C08A2E", text: "text-[#C08A2E]", label: "Degraded" },
  UNKNOWN: { dot: "#8A8F8C", text: "text-[#8A8F8C]", label: "Unknown" },
};

export const SEVERITY_STYLES: Record<
  Severity,
  { text: string; label: string }
> = {
  LOW: { text: "text-[#5B6663]", label: "Low" },
  MEDIUM: { text: "text-[#C08A2E]", label: "Medium" },
  HIGH: { text: "text-[#C24444]", label: "High" },
  CRITICAL: { text: "text-[#8A1F1F]", label: "Critical" },
};
