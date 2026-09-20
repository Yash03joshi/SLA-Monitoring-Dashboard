import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // --------------------------------
    // Monitoring check filters
    // --------------------------------

    const where: any = {};

    if (from || to) {
      where.timestamp = {};

      if (from) {
        const start = new Date(`${from}T00:00:00.000Z`);

        if (Number.isNaN(start.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid from date",
            },
            { status: 400 },
          );
        }

        where.timestamp.gte = start;
      }

      if (to) {
        const end = new Date(`${to}T23:59:59.999Z`);

        if (Number.isNaN(end.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid to date",
            },
            { status: 400 },
          );
        }

        where.timestamp.lte = end;
      }
    }

    // --------------------------------
    // Fetch monitoring checks
    // --------------------------------

    const checks = await prisma.monitoringCheck.findMany({
      where,

      select: {
        serviceId: true,
        status: true,
        latencyMs: true,

        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // --------------------------------
    // Overall statistics
    // --------------------------------

    const totalChecks = checks.length;

    const successfulChecks = checks.filter(
      (check) => check.status === "UP",
    ).length;

    const failedChecks = checks.filter(
      (check) => check.status === "DOWN",
    ).length;

    const degradedChecks = checks.filter(
      (check) => check.status === "DEGRADED",
    ).length;

    const unknownChecks = checks.filter(
      (check) => check.status === "UNKNOWN",
    ).length;

    const availability =
      totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

    // --------------------------------
    // Latency statistics
    // --------------------------------

    const latencies = checks
      .map((check) => check.latencyMs)
      .filter(
        (latency): latency is number =>
          latency !== null && Number.isFinite(latency),
      )
      .sort((a, b) => a - b);

    const averageLatency =
      latencies.length > 0
        ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length
        : 0;

    const p95Latency =
      latencies.length > 0
        ? latencies[Math.ceil(latencies.length * 0.95) - 1]
        : 0;

    // --------------------------------
    // Per-service statistics
    // --------------------------------

    const serviceMap = new Map<
      string,
      {
        id: string;
        name: string;
        total: number;
        up: number;
        down: number;
        degraded: number;
        latencies: number[];
      }
    >();

    for (const check of checks) {
      if (!serviceMap.has(check.serviceId)) {
        serviceMap.set(check.serviceId, {
          id: check.service.id,
          name: check.service.name,
          total: 0,
          up: 0,
          down: 0,
          degraded: 0,
          latencies: [],
        });
      }

      const service = serviceMap.get(check.serviceId)!;

      service.total++;

      if (check.status === "UP") {
        service.up++;
      }

      if (check.status === "DOWN") {
        service.down++;
      }

      if (check.status === "DEGRADED") {
        service.degraded++;
      }

      if (check.latencyMs !== null) {
        service.latencies.push(check.latencyMs);
      }
    }

    const services = Array.from(serviceMap.values()).map((service) => {
      const sortedLatencies = service.latencies.sort((a, b) => a - b);

      const avgLatency =
        sortedLatencies.length > 0
          ? sortedLatencies.reduce((sum, value) => sum + value, 0) /
            sortedLatencies.length
          : 0;

      const p95 =
        sortedLatencies.length > 0
          ? sortedLatencies[Math.ceil(sortedLatencies.length * 0.95) - 1]
          : 0;

      return {
        id: service.id,

        name: service.name,

        totalChecks: service.total,

        successfulChecks: service.up,

        failedChecks: service.down,

        degradedChecks: service.degraded,

        availability:
          service.total > 0
            ? Number(((service.up / service.total) * 100).toFixed(3))
            : 0,

        averageLatency: Number(avgLatency.toFixed(2)),

        p95Latency: Number(p95.toFixed(2)),
      };
    });

    // --------------------------------
    // Incident filters
    // --------------------------------

    const incidentWhere: any = {};

    if (from || to) {
      incidentWhere.startedAt = {};

      if (from) {
        incidentWhere.startedAt.gte = new Date(`${from}T00:00:00.000Z`);
      }

      if (to) {
        incidentWhere.startedAt.lte = new Date(`${to}T23:59:59.999Z`);
      }
    }

    // --------------------------------
    // Fetch incidents
    // --------------------------------

    const incidents = await prisma.incident.findMany({
      where: incidentWhere,

      orderBy: {
        startedAt: "desc",
      },

      select: {
        id: true,
        serviceId: true,
        startedAt: true,
        resolvedAt: true,
        status: true,
        severity: true,
        durationMin: true,

        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // --------------------------------
    // Incident statistics
    // --------------------------------

    const totalDowntime = incidents.reduce(
      (total, incident) => total + (incident.durationMin ?? 0),
      0,
    );

    const openIncidents = incidents.filter(
      (incident) => incident.status === "OPEN",
    ).length;

    const resolvedIncidents = incidents.filter(
      (incident) => incident.status === "RESOLVED",
    ).length;

    // --------------------------------
    // Response
    // --------------------------------

    return NextResponse.json({
      success: true,

      overview: {
        totalChecks,

        successfulChecks,

        failedChecks,

        degradedChecks,

        unknownChecks,

        availability: Number(availability.toFixed(3)),

        averageLatency: Number(averageLatency.toFixed(2)),

        p95Latency: Number(p95Latency.toFixed(2)),

        incidentCount: incidents.length,

        openIncidents,

        resolvedIncidents,

        totalDowntimeMinutes: totalDowntime,
      },

      services,

      incidents,
    });
  } catch (error) {
    console.error("Failed to calculate stats:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate statistics",
      },
      { status: 500 },
    );
  }
}
