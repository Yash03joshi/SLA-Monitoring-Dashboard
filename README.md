# SLA Monitoring Dashboard

A full-stack SLA monitoring dashboard built with **Next.js, Prisma,
PostgreSQL, and Vercel**.

The application takes monitoring/check data, processes and persists it,
and provides a single dashboard for viewing service health,
availability, latency, incidents, downtime, and underlying check logs.

> **Implementation time:** \~2 hours\
> The core assignment was completed within 2 hours. With more time, I
> would improve the UI, add stronger validation/test coverage, improve
> data-processing edge cases, and further polish the architecture and
> documentation.

## Live Demo

**Live application:**\
https://sla-monitoring-dashboard-p93hp4z5c-yash03joshis-projects.vercel.app/

**GitHub repository:**\
https://github.com/Yash03joshi/SLA-Monitoring-Dashboard

---

## Tech Stack

- **Next.js** --- frontend and API routes
- **TypeScript** --- application type safety
- **PostgreSQL** --- persistent data storage
- **Prisma ORM** --- database schema, migrations/pushes, and type-safe
  database access without manually writing SQL queries
- **Vercel** --- deployment and serverless execution
- **Tailwind CSS** --- UI styling

---

## Architecture

The application follows a simple flow:

```text
CSV / Monitoring Data
        |
        v
   Upload UI
        |
        v
 Next.js API Route
        |
        v
 Validate / Clean / Process
        |
        v
 PostgreSQL
        |
        v
 Prisma ORM
        |
        v
 Dashboard APIs
        |
        v
 Dashboard UI
```

### Why these technologies?

#### Next.js

Next.js provides both the frontend and backend API layer in one project.
This kept the implementation small and allowed the application to be
deployed easily on Vercel.

#### PostgreSQL

PostgreSQL was selected as the persistent database because the
monitoring data is structured and relational. I used a free PostgreSQL
provider (Nova) so the project could remain within the assignment's
no-cost requirement.

#### Prisma

Prisma is used as the ORM instead of manually writing SQL queries.

It provides:

- Type-safe database access
- A schema-first database model
- Easy database setup
- Cleaner API/database code
- Generated Prisma Client

#### Vercel

The application is deployed on Vercel. The Next.js API routes run as
serverless functions, so there is no long-running backend server that
needs to be maintained.

---

## Application Structure

The application currently contains:

### Frontend

A single dashboard page containing:

- Service overview
- Availability information
- Latency information
- Incident/downtime information
- Monitoring logs
- Date/date-range filtering
- Upload functionality

### Backend APIs

The project contains **3 API endpoints** responsible for the main
backend functionality:

1.  **Upload / processing API**
    - Receives monitoring data
    - Processes the uploaded data
    - Validates/cleans the records
    - Persists the useful data into PostgreSQL
2.  **Stats / dashboard API**
    - Reads persisted monitoring data
    - Calculates dashboard statistics
    - Returns service-level monitoring information
3.  **Logs API**
    - Reads the underlying monitoring records
    - Supports date/date-range filtering
    - Returns records used by the dashboard logs view

The exact API implementation can be found inside the `app/api`
directory.

---

## Database

The application uses PostgreSQL with Prisma.

The general data flow is:

```text
Raw monitoring data
        ↓
Validation / cleaning
        ↓
Prisma
        ↓
PostgreSQL
        ↓
API queries
        ↓
Dashboard
```

This means the dashboard does not depend on the uploaded file remaining
in memory. Once processed, the data is persisted and can be queried
again.

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Yash03joshi/SLA-Monitoring-Dashboard.git
```

### 2. Enter the project directory

```bash
cd SLA-Monitoring-Dashboard
```

If the repository is cloned into a differently named directory, use that
directory instead.

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```bash
nano .env
```

Add the PostgreSQL connection string:

```env
DATABASE_URL="your_postgresql_connection_string"
```

Replace the value with your Nova PostgreSQL connection string.

You can also create/edit the file using:

```bash
touch .env
```

and then open it in your preferred editor.

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Push the Prisma schema to PostgreSQL

```bash
npx prisma db push
```

This creates/updates the database structure defined in the Prisma
schema.

### 7. Start the development server

```bash
npm run dev
```

The application should then be available at:

```text
http://localhost:3000
```

---

## Environment Variables

The application requires:

Variable Description

---

`DATABASE_URL` PostgreSQL connection string

Do not commit `.env` or database credentials to GitHub.

---

## Prisma Commands

Useful commands while developing:

### Generate Prisma Client

```bash
npx prisma generate
```

### Push schema changes

```bash
npx prisma db push
```

### Open Prisma Studio

```bash
npx prisma studio
```

Prisma Studio can be useful for inspecting the persisted monitoring data
during development.

---

## Deployment

The project is deployed using Vercel.

### Deploy your own instance

1.  Fork or clone the repository.
2.  Import the repository into Vercel.
3.  Add the following environment variable in the Vercel project
    settings:

```env
DATABASE_URL=your_postgresql_connection_string
```

4.  Deploy the project.
5.  Make sure the PostgreSQL database is reachable from the deployed
    application.
6.  Run the Prisma setup against the configured database if required:

```bash
npx prisma generate
npx prisma db push
```

The deployed Next.js API routes run through Vercel's serverless
infrastructure.

---

## Data Processing

The assignment provides monitoring data containing health-check records
for multiple services.

The expected data includes information such as:

- Timestamp
- HTTP status code
- Response latency
- Monitoring agent/region
- Service

The application processes the incoming records before storing them.

The processing pipeline is intended to:

1.  Read the uploaded monitoring data.
2.  Validate the records.
3.  Normalize useful fields.
4.  Handle invalid/unusable records.
5.  Store cleaned records in PostgreSQL.
6.  Query the persisted records for dashboard calculations.

### Data-quality findings

The assignment specifically requires identifying the data-quality issues
present in the supplied dataset.

The implementation handles the issues discovered during processing
rather than assuming that every incoming row is valid.

> **Note:** The exact data-quality findings should be updated here with
> the specific issues discovered in the supplied dataset and the exact
> handling applied to each one. This section should reflect the final
> dataset analysis rather than generic assumptions.

---

## Dashboard Metrics

The dashboard focuses on metrics useful for understanding service
reliability and SLA performance.

The current overview includes metrics such as:

- Total checks
- Successful checks
- Failed checks
- Degraded checks
- Unknown checks
- Availability
- Average latency
- P95 latency
- Incident count
- Total downtime

The dashboard also exposes the underlying monitoring logs so that
aggregate numbers can be inspected against individual check records.

---

## Assumptions & Design Decisions

### Availability

Availability is derived from the processed monitoring check results
rather than being manually entered.

### Persistence

Processed data is stored in PostgreSQL so that the dashboard can query
it after the upload/processing request has completed.

### Date filtering

The logs view supports filtering by a single date or a date range.

### No authentication

Authentication and user accounts were intentionally not implemented
because they were explicitly out of scope for the assignment.

### No multi-tenancy

The application does not implement separate users, organizations, or
tenant-level data isolation because multi-tenant support was outside the
requested scope.

### No CI/CD pipeline

A CI pipeline was not added because CI pipelines were explicitly
excluded from the assignment.

### Free-tier infrastructure

The project uses free/no-cost infrastructure for the database and
deployment.

---

## What I Would Improve With More Time

The core implementation was completed in approximately **2 hours**, so
there are several areas I would improve with additional time.

### 1. More robust data validation

I would add stronger schema validation and clearer error reporting for
malformed or unexpected input records.

### 2. Better test coverage

I would add unit and integration tests for:

- Data cleaning
- Availability calculations
- Latency calculations
- P95 calculation
- Downtime calculation
- Date filtering
- API responses
- Invalid uploads

### 3. Improved UI/UX

I would spend more time polishing:

- Dashboard layout
- Loading states
- Empty states
- Error states
- Responsive design
- Charts and visualizations
- Log table interactions

### 4. Better API structure

I would further separate data-processing logic, database access, and API
handlers so the backend would be easier to test and maintain as the
project grows.

### 5. More detailed data-quality reporting

I would expose a processing summary after an upload, such as:

```text
Total rows received
Valid rows
Invalid rows
Duplicates
Rows skipped
Rows stored
```

### 6. Better operational handling

With more time, I would consider:

- Request/file size limits
- More detailed server-side logging
- More granular error handling
- Safer handling of large uploads
- Cleanup/retention policies for old monitoring data

### 7. More polished documentation

I would document the exact dataset anomalies found, the formulas used
for each dashboard metric, and provide screenshots/GIFs of the
application.

---

## Scope

This project intentionally focuses on the core requirements:

- Upload monitoring data
- Process and clean data
- Persist data
- Query persisted data
- Display SLA/monitoring metrics
- Filter underlying logs
- Deploy the application

The following were intentionally not implemented because they were
outside the assignment scope:

- Authentication
- User accounts
- Multi-tenancy
- CI pipelines

---

## Running the Project Quickly

For a quick local setup:

```bash
git clone https://github.com/Yash03joshi/SLA-Monitoring-Dashboard.git
cd SLA-Monitoring-Dashboard
npm install

nano .env
```

Set:

```env
DATABASE_URL="your_postgresql_connection_string"
```

Then:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Project Status

**Status: Completed**

- [x] Next.js application
- [x] PostgreSQL database
- [x] Prisma ORM
- [x] Data upload/processing
- [x] Persistent storage
- [x] Dashboard
- [x] Monitoring statistics
- [x] Logs and date filtering
- [x] 3 backend APIs
- [x] Vercel deployment
- [x] Live application

**Implementation time:** approximately **2 hours**.

The project is intentionally a focused implementation of the assignment
requirements. With additional development time, I would improve
validation, testing, UI polish, data-quality reporting, and production
hardening.
