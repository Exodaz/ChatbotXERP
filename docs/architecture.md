# System Architecture & Tech Stack

## Overview

ChatbotXERP is built as a modular monorepo using **Turborepo** and **pnpm** workspaces. It separates responsibilities between client-facing web applications, background workers, and business logic packages.

---

## Monorepo Layout

```
ChatbotXERP/
├── apps/
│   ├── builder/                # Next.js 16 Web Application & Web Checkout
│   ├── worker/                 # BullMQ Background Job Consumers & Schedulers
│   ├── realtime/               # WebSocket Server for Realtime Inbox
│   └── cli/                    # Management CLI Tool
├── packages/
│   ├── business/               # Core Services (Order, Product, Shipping, Line, Stock)
│   ├── database/               # PostgreSQL Schema & Migrations (Drizzle ORM)
│   ├── worker-config/          # BullMQ Queue Names & Job Payloads
│   ├── ui/                     # Shared UI Components (Tailwind, Radix)
│   └── utils/                  # Shared Utility Functions
└── docs/                       # GitHub Pages Documentation
```

---

## Core Components

### 1. Web Layer (`apps/builder`)
- **Framework**: Next.js 16 (App Router, React 19)
- **Admin Portal**: Accessible at `/space/[workspaceId]/...`
- **Customer Checkout Portal**: Mobile-first webview at `/checkout/[orderToken]`
- **Webhook Handlers**: Located at `/api/webhooks/...` and `/api/checkout/...`

### 2. Background Workers (`apps/worker`)
- **Queue Framework**: BullMQ on Redis
- **Comment Automation Worker**: Concurrently parses live comments and executes atomic reservations.
- **Schedule Cron Worker**: Sweeps expired 24h reservations every 5 minutes and releases stock.

### 3. Data Access Layer (`packages/business` & `packages/database`)
- **Rule**: Application routes and workers **never** run raw SQL directly; they interact through domain services in `@chatbotx.io/business`.
- **Database**: PostgreSQL with Drizzle ORM.
- **Safety**: Schema migrations are version-controlled with snapshot integrity.
