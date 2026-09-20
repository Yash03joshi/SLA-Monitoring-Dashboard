export function getCheckStatus(statusCode: number) {
  if (statusCode >= 200 && statusCode < 400) {
    return "UP" as const;
  }

  if (statusCode >= 500) {
    return "DOWN" as const;
  }

  if (statusCode >= 400) {
    return "DEGRADED" as const;
  }

  return "UNKNOWN" as const;
}

export function latencyToMs(latency: number, unit: string): number | null {
  if (!Number.isFinite(latency)) {
    return null;
  }

  switch (unit.toLowerCase()) {
    case "ms":
      return latency;

    case "s":
      return latency * 1000;

    default:
      return null;
  }
}
