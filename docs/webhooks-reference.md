# Webhook & API Reference

## 1. LINE OA Webhook

- **Endpoint**: `POST /api/webhooks/line?workspaceId={workspaceId}`
- **Headers**:
  - `X-Line-Signature`: Base64 HMAC-SHA256 signature generated with your Channel Secret.
  - `Content-Type`: `application/json`
- **Response**: `200 OK`
  ```json
  {
    "ok": true,
    "processed": 1,
    "cfCount": 1
  }
  ```

---

## 2. Stockroom Warehouse Sync

- **Endpoint**: `POST /api/stock/sync`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "workspaceId": "ws_12345",
    "apiKey": "your_stockroom_api_key",
    "action": "sync"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "ok": true,
    "syncedVariants": 42
  }
  ```

---

## 3. Easyslip Slip Verification Webhook

- **Endpoint**: `POST /api/checkout/easyslip-webhook`
- **Body**: Standard Easyslip verification payload containing bank account, amount, and reference code.
- **Action**: Matches `orderNumber` or `orderToken`, marks order as `paid`, and updates payment status to `verified`.

---

## 4. Moneyspace Payment Callback

- **Endpoint**: `POST /api/checkout/moneyspace-webhook`
- **Body**: Moneyspace transaction notification.
- **Action**: Confirms credit card capture and transitions order status to `paid`.
