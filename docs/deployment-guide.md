# Deployment & VPS Setup Guide

## Infrastructure Architecture

ChatbotXERP is designed to run efficiently on a single VPS (4 vCPUs, 8 GB RAM recommended) or across containerized services.

```mermaid
graph TD
    Nginx["Reverse Proxy (Nginx / Caddy with SSL)"] --> Next["Next.js Web (Port 3123)"]
    Nginx --> Realtime["Realtime WebSocket (Port 1999)"]
    Next --> PG[(PostgreSQL :5433)]
    Next --> Redis[(Redis :6379)]
    Worker["BullMQ Worker"] --> PG
    Worker --> Redis
    Worker --> S3["Object Storage (MinIO :9000)"]
```

---

## Deployment Steps

### 1. VPS Provisioning (Ubuntu 22.04 / 24.04 LTS)
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin git curl
```

### 2. Clone Repository
```bash
git clone https://github.com/Exodaz/ChatbotXERP.git
cd ChatbotXERP
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure database credentials, Redis host, and secret keys are configured:
```env
DATABASE_URL=postgresql://chatbotx:chatbotx@localhost:5433/chatbotx
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 4. Start Infrastructure Containers
```bash
docker compose up -d
```

### 5. Apply Database Migrations
```bash
pnpm --filter @chatbotx.io/database db:migrate
```

### 6. Run Apps via PM2 or Docker
```bash
pnpm build
pm2 start pnpm --name "chatbotx-builder" -- --filter builder start
pm2 start pnpm --name "chatbotx-worker" -- --filter worker start
```
