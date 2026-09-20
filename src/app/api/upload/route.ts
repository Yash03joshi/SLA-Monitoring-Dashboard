import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { prisma } from "../../../lib/prisma";
import { getCheckStatus, latencyToMs } from "../../../lib";
import { Severity } from "@prisma/client";

type CSVRow = {
  service_id?: string;
  service_name?: string;
  timestamp?: string;
  status_code?: string;
  latency?: string;
  latency_unit?: string;
  agent?: string;
  region?: string;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV file is required",
        },
        { status: 400 },
      );
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        {
          success: false,
          error: "Only CSV files are supported",
        },
        { status: 400 },
      );
    }

    const csvText = await file.text();

    if (!csvText.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV file is empty",
        },
        { status: 400 },
      );
    }

    let rows: CSVRow[];

    try {
      rows = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid CSV format",
        },
        { status: 400 },
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV contains no records",
        },
        { status: 400 },
      );
    }

    const validChecks = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const rowNumber = i + 2;

      if (!row.service_id) {
        errors.push(`Row ${rowNumber}: missing service_id`);
        continue;
      }

      if (!row.service_name) {
        errors.push(`Row ${rowNumber}: missing service_name`);
        continue;
      }

      if (!row.timestamp) {
        errors.push(`Row ${rowNumber}: missing timestamp`);
        continue;
      }

      if (!row.status_code) {
        errors.push(`Row ${rowNumber}: missing status_code`);
        continue;
      }

      if (!row.agent) {
        errors.push(`Row ${rowNumber}: missing agent`);
        continue;
      }

      if (!row.region) {
        errors.push(`Row ${rowNumber}: missing region`);
        continue;
      }

      const timestamp = new Date(row.timestamp);

      if (Number.isNaN(timestamp.getTime())) {
        errors.push(`Row ${rowNumber}: invalid timestamp`);
        continue;
      }

      const statusCode = Number(row.status_code);

      if (!Number.isInteger(statusCode) || statusCode < 100) {
        errors.push(`Row ${rowNumber}: invalid status code`);
        continue;
      }

      const latency = Number(row.latency);

      const latencyMs = latencyToMs(latency, row.latency_unit ?? "ms");

      if (latencyMs === null) {
        errors.push(`Row ${rowNumber}: invalid latency`);
        continue;
      }

      if (latencyMs < 0) {
        errors.push(`Row ${rowNumber}: negative latency`);
        continue;
      }

      const status = getCheckStatus(statusCode);

      validChecks.push({
        serviceId: row.service_id.trim(),
        serviceName: row.service_name.trim(),
        timestamp,
        statusCode,
        latencyMs,
        status,
        agent: row.agent.trim(),
        region: row.region.trim(),
      });
    }

    if (validChecks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid records found",
          totalRows: rows.length,
          invalidRows: errors.length,
          errors,
        },
        { status: 400 },
      );
    }

    const uploadId = crypto.randomUUID();

    await prisma.$transaction(
      async (tx) => {
        const services = new Map<string, string>();

        for (const check of validChecks) {
          services.set(check.serviceId, check.serviceName);
        }

        for (const [serviceId, serviceName] of services) {
          await tx.service.upsert({
            where: {
              id: serviceId,
            },
            update: {
              name: serviceName,
            },
            create: {
              id: serviceId,
              name: serviceName,
            },
          });
        }

        await tx.monitoringCheck.createMany({
          data: validChecks.map((check) => ({
            serviceId: check.serviceId,
            timestamp: check.timestamp,
            statusCode: check.statusCode,
            latencyMs: check.latencyMs,
            status: check.status,
            agent: check.agent,
            region: check.region,
          })),
        });

        const checksByService = new Map<string, typeof validChecks>();

        for (const check of validChecks) {
          if (!checksByService.has(check.serviceId)) {
            checksByService.set(check.serviceId, []);
          }

          checksByService.get(check.serviceId)!.push(check);
        }

        for (const [serviceId, serviceChecks] of checksByService) {
          const sortedChecks = [...serviceChecks].sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
          );

          let incidentStart: Date | null = null;

          for (let i = 0; i < sortedChecks.length; i++) {
            const check = sortedChecks[i];

            if (check.status === "DOWN") {
              if (!incidentStart) {
                incidentStart = check.timestamp;
              }

              continue;
            }

            if (incidentStart) {
              const resolvedAt = check.timestamp;

              const durationMin = Math.max(
                0,
                Math.round(
                  (resolvedAt.getTime() - incidentStart.getTime()) / 60000,
                ),
              );

              const downCount = sortedChecks.filter(
                (c) =>
                  c.timestamp >= incidentStart! &&
                  c.timestamp <= resolvedAt &&
                  c.status === "DOWN",
              ).length;

              let severity: Severity;

              if (durationMin >= 60 || downCount >= 5) {
                severity = "CRITICAL";
              } else if (durationMin >= 30 || downCount >= 3) {
                severity = "HIGH";
              } else if (durationMin >= 15 || downCount >= 2) {
                severity = "MEDIUM";
              } else {
                severity = "LOW";
              }

              await tx.incident.create({
                data: {
                  serviceId,
                  startedAt: incidentStart,
                  resolvedAt,
                  status: "RESOLVED",
                  severity,
                  durationMin,
                },
              });

              incidentStart = null;
            }
          }
          if (incidentStart) {
            const lastCheck = sortedChecks[sortedChecks.length - 1];

            const durationMin = Math.max(
              0,
              Math.round(
                (lastCheck.timestamp.getTime() - incidentStart.getTime()) /
                  60000,
              ),
            );

            const downCount = sortedChecks.filter(
              (c) => c.timestamp >= incidentStart! && c.status === "DOWN",
            ).length;

            let severity: Severity;

            if (durationMin >= 60 || downCount >= 5) {
              severity = "CRITICAL";
            } else if (durationMin >= 30 || downCount >= 3) {
              severity = "HIGH";
            } else if (durationMin >= 15 || downCount >= 2) {
              severity = "MEDIUM";
            } else {
              severity = "LOW";
            }

            await tx.incident.create({
              data: {
                serviceId,
                startedAt: incidentStart,
                resolvedAt: null,
                status: "OPEN",
                severity,
                durationMin,
              },
            });
          }
        }
      },
      {
        timeout: 60000,
      },
    );

    return NextResponse.json({
      success: true,
      uploadId,

      summary: {
        totalRows: rows.length,
        insertedRows: validChecks.length,
        rejectedRows: errors.length,
        services: new Set(validChecks.map((check) => check.serviceId)).size,
      },

      errors,
    });
  } catch (error) {
    console.error("CSV upload failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process CSV",
      },
      { status: 500 },
    );
  }
}
