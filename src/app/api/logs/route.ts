import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const serviceId = searchParams.get("serviceId");
    const status = searchParams.get("status");

    const page = Math.max(Number(searchParams.get("page") || 1), 1);

    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || 100), 1),
      500,
    );

    const where: any = {};

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (status) {
      where.status = status;
    }

    // Single date
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid date",
          },
          { status: 400 },
        );
      }

      where.timestamp = {
        gte: start,
        lte: end,
      };
    }

    // Date range
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

    const [logs, total] = await Promise.all([
      prisma.monitoringCheck.findMany({
        where,

        orderBy: {
          timestamp: "desc",
        },

        skip: (page - 1) * limit,
        take: limit,

        include: {
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.monitoringCheck.count({
        where,
      }),
    ]);

    return NextResponse.json({
      success: true,

      data: logs,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch logs:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch logs",
      },
      { status: 500 },
    );
  }
}
