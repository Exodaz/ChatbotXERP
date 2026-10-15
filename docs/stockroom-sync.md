# Stockroom API Integration

## Overview

ChatbotXERP integrates seamlessly with external warehouse systems via the Stockroom API specification (`http://exodaz.me/stockinventory` / `https://stockinventory.exodazth.workers.dev/api/v1`).

---

## Supported Endpoints

The `StockroomClient` (`packages/business/src/stock-sync/stockroom-client.ts`) communicates with:

1. **`GET /ping`**: Validates API connectivity and key authentication.
2. **`GET /stock`**: Retrieves current stock counts, reservations, and SKU availability.
3. **`GET /products`**: Fetches product catalogs, variant combinations, colors, and sizes.

---

## Synchronization Features

### 1. Manual Sync from Admin Settings
Navigate to **Settings → External Stockroom Sync** (`/space/[workspaceId]/ecommerce-settings`):
- Test API key connectivity with 1 click.
- Sync stock counts across all active variants.
- Import new products directly into ChatbotXERP catalog.

### 2. Scheduled & Webhook Triggered Sync
External ERPs or cron jobs can notify ChatbotXERP of stock updates via webhook:

```http
POST /api/stock/sync HTTP/1.1
Host: your-domain.com
Content-Type: application/json

{
  "workspaceId": "ws_12345",
  "apiKey": "your_stockroom_api_key",
  "action": "sync"
}
```
