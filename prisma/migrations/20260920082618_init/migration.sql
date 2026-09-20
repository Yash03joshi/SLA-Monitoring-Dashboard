-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('UP', 'DOWN', 'DEGRADED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slaTarget" DOUBLE PRECISION NOT NULL DEFAULT 99.9,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringCheck" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "status" "CheckStatus" NOT NULL,
    "responseTimeMs" INTEGER,
    "statusCode" INTEGER,
    "endpoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitoringCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "Severity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

-- CreateIndex
CREATE INDEX "Service_name_idx" ON "Service"("name");

-- CreateIndex
CREATE INDEX "MonitoringCheck_serviceId_idx" ON "MonitoringCheck"("serviceId");

-- CreateIndex
CREATE INDEX "MonitoringCheck_timestamp_idx" ON "MonitoringCheck"("timestamp");

-- CreateIndex
CREATE INDEX "MonitoringCheck_serviceId_timestamp_idx" ON "MonitoringCheck"("serviceId", "timestamp");

-- CreateIndex
CREATE INDEX "Incident_serviceId_idx" ON "Incident"("serviceId");

-- CreateIndex
CREATE INDEX "Incident_startedAt_idx" ON "Incident"("startedAt");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "Incident_severity_idx" ON "Incident"("severity");

-- AddForeignKey
ALTER TABLE "MonitoringCheck" ADD CONSTRAINT "MonitoringCheck_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
