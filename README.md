# BeakDash Business Intelligence Platform

<p align="center">
  <img src="https://github.com/user-attachments/assets/db17dcfa-37d3-4b48-a545-415eb736d9bc" alt="BeakDash BI Banner" width="100%" />
</p>

<p align="center">
  <strong>Next-Generation Autonomous Agentic Business Intelligence & Data Analytics Engine</strong><br>
  Built with Next.js 16, TypeScript, Drizzle ORM, OpenAI, PostgreSQL, and modern BI architectural patterns from Redash, Lightdash, and Evidence.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.45-emerald?style=flat-square" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/AI_Agentic_Engine-ReAct_Loops-purple?style=flat-square" alt="Agentic AI" />
  <img src="https://img.shields.io/badge/Self_Healing-SQL_Engine-rose?style=flat-square" alt="Self-Healing" />
  <img src="https://img.shields.io/badge/Unit_Tests-33%2F33_Passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License" />
</p>

---

## 🌟 Executive Overview

**BeakDash** is an enterprise-ready, AI-powered Business Intelligence platform designed for both technical engineers and business leaders. It seamlessly combines direct database connections (PostgreSQL, MySQL, SQLite, REST APIs), a **Self-Healing ReAct Agentic BI Studio**, and deep data observability (DB-QA alerts, automated monitoring, secure embeds, and period-over-period trend analytics).

---

## 🚀 Key Architectural Capabilities

```mermaid
flowchart TD
    subgraph "1. Autonomous Agentic BI Engine"
        A[User Goal: Plain English] --> B[ReAct Reasoning & Thinking Loops]
        B --> C[Schema Introspection & Tool Calling]
        C --> D[Self-Healing SQL & Traceback Refinement]
        D --> E[Auto-Created Dashboards, Datasets & Charts]
    end

    subgraph "2. Redash, Lightdash & Evidence Modern BI"
        F[Dynamic SQL Parameters: &#123;&#123; param:type &#125;&#125;]
        G[SHA-256 query_hash & Sub-2ms Cache]
        H[Semantic Layer & Metric Formatters]
        I[PoP Delta Analytics & Sparklines]
    end

    subgraph "3. Enterprise Security & Observability"
        J[DB-QA Condition Evaluator & Multi-Channel Alerts]
        K[HMAC-SHA256 Cryptographic Iframe Embeds]
        L[Sliding-Window Rate Limiting & Deep Health Check]
        M[@beakdash/sdk & @beakdash/shared Monorepo]
    end

    E --> F
    I --> J
```

---

### 1. 🧠 Autonomous Agentic BI Studio & Thinking Loops
* **ReAct Autonomous Reasoning**: Operates in multi-step Reason $\rightarrow$ Act $\rightarrow$ Observe $\rightarrow$ Reflect loops.
* **Auto-Dashboard & Chart Generation**: Translates high-level goals into complete dashboards, optimal datasets, and multi-chart layouts (Stat Cards, Columns, Area Trends, Donut charts).
* **Context-Aware Editing**: Introspects existing dashboards and widgets to rename charts, switch visualizations, or inject filters dynamically.
* **Live Thought Trace UI**: Transparently renders `<thought>` reasoning steps, tool actions, and execution observations in the chat UI.

### 2. 🩹 Self-Healing SQL Engine
* **Automatic Traceback Refinement**: When a query fails (e.g. column typo, missing schema prefix, division by zero), the engine intercepts the database error code (`42703`, `42P01`, `22012`), analyzes the schema, and automatically repairs the SQL.
* **Zero-Division Protection**: Injects `NULLIF(denominator, 0)` guards automatically.
* **Zero-Row Anomaly Correction**: Detects empty result sets caused by strict filters and relaxes criteria.

### 3. 🔍 Redash-Style Dynamic Parameters & Result Caching
* **Parameterized SQL**: Write `{{ param:type:default }}` directly in SQL queries:
  ```sql
  SELECT lab_name, SUM(total) AS total_tests
  FROM dashboard.tests_done_aggregate
  WHERE year_published >= {{ start_year:number:2023 }}
    AND total >= {{ min_volume:number:100 }}
  GROUP BY lab_name;
  ```
* **Auto-Generated Parameter Inputs**: Dataset Studio parses parameters and renders dynamic DatePickers, Number inputs, and Text fields.
* **Deterministic SHA-256 Query Cache**: Hashes `(connectionId + sql + parameters)` to deliver `< 2ms` cached query results with configurable TTL and 1-click cache bypass.
* **1-Click Export**: Instant CSV and JSON query output downloads.

### 4. 📊 Lightdash Semantic Layer & Value Formatters
* **Temporal Truncations**: Truncates time-series data to `year`, `quarter`, `month`, `week`, `day`, or `hour`.
* **Semantic Metrics**: Aggregations (`count`, `distinct_count`, `sum`, `avg`, `min`, `max`, `median`).
* **Virtual Calculated Fields**: Safe row-level calculated expressions (`(row.revenue - row.cost)`).
* **Value Formatters**: Native Currency (`$1.2M`), Percent (`24.6%`), Compact (`450.0K`), and DateTime.

### 5. 📈 Evidence.dev-Style Period-over-Period Delta Analytics
* **PoP Comparison Engine**: Computes `deltaValue`, `percentChange` (e.g. `+14.2%`), and trend direction (`up`, `down`, `flat`).
* **Sparklines**: Generates historical data point arrays for rendering mini sparklines on Stat Cards.

### 6. 🛡️ DB-QA Automated Data Quality & Alerting
* **Condition Evaluator**: Numeric thresholds, string equality, between bounds, null checks, and row count triggers with human-readable diagnostic reports.
* **Multi-Channel Dispatcher**: Dispatches alerts to **Slack Webhooks** (rich Block Kit message cards), custom webhooks, email summaries, and audit logs with cooldown throttling.
* **Automated Runner**: Executes scheduled database quality checks and logs run history to `db_qa_execution_results`.

### 7. 🔒 Secure Iframe Embeds & Monorepo SDK
* **Cryptographic HMAC-SHA256 Token Manager**: Expiration timestamps, allowed dashboard scoping, and domain whitelist verification.
* **Zero-Scrollbar Embed Player** ([`/embed/[id]`](file:///embed/1)): Standalone iframe player with `postMessage` auto-resizing (`beakdash:resize`) and light/dark theme overrides.
* **`@beakdash/sdk` & `@beakdash/shared`**: Full TypeScript client SDK with 100% test coverage for Dashboards, Widgets, Connections, Datasets, DB-QA, and Embeds.

### 8. 🛡️ Enterprise Security & Hardening
* **Sliding-Window Rate Limiter**: Configurable rate limits on AI and Query Execution endpoints.
* **Content Security Policy (CSP)**: `frame-ancestors *` on `/embed/*`, `SAMEORIGIN` on app pages, `X-Content-Type-Options: nosniff`.
* **Deep Health Check** ([`/api/health`](file:///api/health)): Live DB ping, latency benchmark, memory RSS / heap tracking, and uptime metrics.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|:---|:---|
| **Framework** | Next.js 16.3 (App Router, Turbopack, Server Actions) |
| **Language** | TypeScript 5.9 (Strict Type Checking) |
| **Database & ORM** | PostgreSQL, MySQL, SQLite, Drizzle ORM |
| **AI & LLM** | OpenAI GPT-4o / GPT-4o-mini (ReAct Agentic Loops & Self-Healing) |
| **State & Data** | TanStack React Query v5, Zustand |
| **Styling & UI** | Tailwind CSS, Shadcn UI, Radix UI Primitives, Lucide Icons |
| **Visualizations** | Ant Design Charts, Recharts, Custom Canvas |
| **Testing** | Vitest (33 Unit Tests, 100% pass rate) |
| **Monorepo** | pnpm workspaces (`@beakdash/sdk`, `@beakdash/shared`) |

---

## 📁 Project Structure

```
beakdash/
├── app/
│   ├── api/                     # REST & Serverless API Routes
│   │   ├── ai/                  # AI Copilot & Autonomous Agent (/api/ai/agent)
│   │   ├── connections/         # Data connections, live testing, schema info
│   │   ├── dashboards/          # Dashboard CRUD & layout endpoints
│   │   ├── datasets/            # Datasets & live parameter preview
│   │   ├── db-qa/               # Automated data quality checks & alerts
│   │   ├── embeds/              # HMAC-SHA256 token manager
│   │   └── health/              # Deep system health check
│   ├── components/              # UI Components & Modules
│   │   ├── ai/                  # Autonomous AI Studio & SQL Copilot
│   │   ├── layout/              # Sidebar, Header, Breadcrumbs, Space selector
│   │   └── widgets/             # Chart renders (stat-card, bar, column, line, area, pie)
│   ├── connections/             # Connections Studio with Schema Explorer
│   ├── dashboard/               # Dashboard Grid Layout with drag-and-drop
│   ├── datasets/                # Dataset Studio with Redash Parameter bindings
│   ├── db-qa/                   # Quality check runner & alert manager
│   ├── embed/[id]/              # Zero-scrollbar iframe embed player
│   └── lib/                     # Server & Client Core Libraries
│       ├── ai/                  # Agentic BI Engine (agentic-bi.ts, self-healing.ts)
│       ├── data/                # Lightdash Semantic Layer & Evidence KPI Analytics
│       ├── db/                  # Connection pool, query engine, cache, schema
│       └── db-qa/               # Condition evaluator, alert notifier, runner
├── packages/
│   ├── sdk/                     # Official @beakdash/sdk TypeScript client
│   └── shared/                  # Shared types, Zod schemas, and utilities
├── drizzle.config.ts            # Drizzle ORM configuration
├── next.config.ts               # Next.js 16 configuration with CSP & CORS
├── pnpm-workspace.yaml          # Monorepo configuration
└── README.md                    # Project Documentation
```

---

## ⚡ Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/aurthurm/beakdash.git
cd beakdash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/beakdash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### 3. Apply Database Migrations
```bash
pnpm run db:push
```

### 4. Start Development Server
```bash
pnpm run dev
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🧪 Testing & Verification

Run the comprehensive unit test suite:
```bash
# Run SDK & BI Engine Unit Tests
pnpm --filter @beakdash/sdk test

# Run TypeScript Type-Check
pnpm run check

# Build Production Next.js Bundle
pnpm run build
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
