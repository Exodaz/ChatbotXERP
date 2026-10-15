# ChatbotXERP 🚀

<p align="center">
  <strong>Omnichannel Facebook Live & LINE OA CF Automation with E-Commerce ERP & Flexible Stock Cap</strong>
  <br>
  An enterprise-grade live commerce ERP built for high-volume live streamers, fashion brands, and multi-channel retailers.
</p>

<p align="center">
  <a href="https://exodaz.github.io/ChatbotXERP/"><img src="https://img.shields.io/badge/docs-GitHub%20Pages-blue?style=flat-square" alt="Documentation"></a>
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/PostgreSQL-Drizzle%20ORM-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-BullMQ-DC382D?style=flat-square&logo=redis" alt="Redis">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
</p>

---

## 🌟 Key Features

### 1. 🎥 Facebook Live CF Automation
- **Real-Time Comment Stream**: Captures live stream comments via Facebook Graph Webhooks.
- **Intelligent Pattern Matching**: Parses multiple Thai/English CF patterns:
  - `CF A01 2`, `cf a01`, `CF A01x2`
  - `ซีเอฟ ก01 1`, `จอง ข02 3`
- **In-DB Atomic Stock Reservation**: High-concurrency row locking prevents overselling.
- **Omnichannel Bill Merging (Combined Bill)**: Automatically appends newly CF-ed items into a single active order for the customer within the live session.
- **Dual Dispatch**: Replies publicly under the comment and instantly sends a Private Reply DM with the direct checkout bill link.

### 2. 💬 LINE Official Account (LINE OA) Integration
- **Full LINE Messaging API**: Verified with HMAC-SHA256 signature verification.
- **Auto Add-Friend Greeting**: Welcomes new followers with clear shopping and CF instructions.
- **In-Chat CF Ordering**: Customers can type CF codes directly into the LINE OA chat anytime.
- **Interactive LINE Flex Messages**: Beautiful receipts displaying order items, pricing breakdown, reservation timer, and a direct `💳 กดชำระเงินและแจ้งที่อยู่` button.

### 3. 📦 Flexible Stock & Overbooking Cap
- **Fashion Catalog & SKU Variants**: Supports multi-attribute combinations (Colors, Sizes, SKUs, Live Codes).
- **Overbooking / Backorder Cap (`maxCapQuantity`)**: Set maximum booking quotas to accept pre-orders and incoming stock without manual intervention.
- **Atomic Stock Ledger**: Tracks `quantity` (physical), `reservedQuantity` (CF holds), and `maxCapQuantity` (ceiling).
- **Automated 24h Expiry Purge**: A BullMQ cron scheduler sweeps expired reservations every 5 minutes and returns held items to inventory.

### 4. 🔄 2-Way Stockroom API Sync
- **External Warehouse Sync**: Integrates with Stockroom API (`http://exodaz.me/stockinventory` / `https://stockinventory.exodazth.workers.dev/api/v1`).
- **Catalog Import**: 1-click import of products, SKUs, and variant stock.
- **Automated Webhook Sync**: `POST /api/stock/sync` webhook for inventory synchronization.

### 5. 💳 Web Checkout & Payment Verification
- **Customer Checkout Portal** (`/checkout/[orderToken]`):
  - Mobile-first responsive checkout bill.
  - Multi-item order summary and real-time reservation countdown timer.
  - Address collection form (Recipient name, phone, address, province, postal code).
- **Payment Methods**:
  - **Bank Transfer + Automated Slip Verification**: Powered by **Easyslip API** (validates amount, receiving account, and duplicate slip protection).
  - **Credit Card / Online Payment**: Powered by **Moneyspace Payment Gateway**.

### 6. 🚚 Shipping & Fulfillment
- **Integrated Carriers**: Native tracking generation for **Flash Express**, **J&T Express**, **Kerry Express**, **Thailand Post (ไปรษณีย์ไทย)**, and **SPX Express**.
- **Admin Orders Hub** (`/space/[workspaceId]/orders`): Search, filter, approve payments, view attached bank slips, and assign tracking numbers.
- **Standard 100x150 mm Thermal Shipping Labels** (`/space/[workspaceId]/orders/print?ids=...`):
  - Standard thermal sticker format & A4 multi-label view.
  - Sender / Recipient details.
  - Vector SVG Barcode.
  - Built-in Item Packing Checklist.

### 7. 📊 Live Sales Analytics & Real-Time Dashboard
- **Session KPI Cards** (`/space/[workspaceId]/live-sales`):
  - Realized Revenue (Paid orders) vs. Potential Revenue (Reserved uncollected).
  - Conversion Rate % and Average Order Value (AOV).
  - Top 8 Best-Selling SKU Variants with visual sales bars.
  - Payment method breakdown & Hourly sales timeline.
- **AI Cart Recovery**: 1-click Urgency Reminder generation for customers with pending bills before reservation expiry.

---

## 🏗️ Tech Stack & Architecture

- **Monorepo**: [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/)
- **Frontend / Web Checkout**: [Next.js 16](https://nextjs.org/) (App Router, React 19, Tailwind CSS, Radix UI)
- **Background Workers**: [BullMQ](https://bullmq.io/) + Redis
- **Database & ORM**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Storage**: S3-compatible Object Storage (MinIO / RustFS)
- **Realtime Service**: Node.js WebSocket Server

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js >= 24
- pnpm 10.x
- Docker & Docker Compose

### 1. Clone & Install
```bash
git clone https://github.com/Exodaz/ChatbotXERP.git
cd ChatbotXERP
pnpm install
```

### 2. Start Infrastructure (PostgreSQL, Redis, S3)
```bash
docker compose up -d
```
- **PostgreSQL**: `localhost:5433` (DB: `chatbotx`, User: `chatbotx`, Pass: `chatbotx`)
- **Redis**: `localhost:6379`
- **MinIO S3**: `localhost:9000` / Console `9001`

### 3. Setup Database Schema & Migrations
```bash
pnpm --filter @chatbotx.io/database db:migrate
```

### 4. Start Development Server
```bash
pnpm --filter builder dev
```
Open **`http://localhost:3123`** in your browser.

---

## 🧪 Testing

ChatbotXERP includes comprehensive unit test suites covering all ERP business logic:

```bash
pnpm --filter @chatbotx.io/business test __tests__/shipping-carriers.test.ts __tests__/order-analytics.test.ts __tests__/stockroom-sync.test.ts __tests__/line-cf-handler.test.ts
```

---

## 📖 Documentation & GitHub Pages

Full documentation with architecture diagrams, API schemas, and deployment guides is published on GitHub Pages:
👉 **[https://exodaz.github.io/ChatbotXERP/](https://exodaz.github.io/ChatbotXERP/)**

---

## 📄 License

Community Edition is licensed under the [MIT License](LICENSE).
