# LINE Official Account (LINE OA) Integration

## Overview

ChatbotXERP integrates natively with the LINE Messaging API, allowing customers to reserve live products directly inside their LINE OA chat and receive an interactive Flex Message bill.

---

## Setup & Configuration

1. In the **LINE Developers Console** (`https://developers.line.biz/`):
   - Create a Provider and a **Messaging API** channel.
   - Generate a **Channel Access Token** (long-lived).
   - Copy the **Channel Secret**.
2. In ChatbotXERP:
   - Navigate to **LINE OA** (`/space/[workspaceId]/line`).
   - Enter your `Channel Access Token` and `Channel Secret`.
   - Click **ตรวจสอบการเชื่อมต่อ** to verify.
3. Configure Webhook URL in LINE Developers Console:
   ```
   https://your-domain.com/api/webhooks/line?workspaceId=<YOUR_WORKSPACE_ID>
   ```
   - Enable **Use webhook**.
   - Verify the webhook.

---

## Customer Experience

1. **Add Friend**: The bot automatically replies with a friendly welcome message explaining how to order.
2. **Text CF in Chat**: The customer types `CF A01 1`.
3. **Interactive Flex Message Receipt**:
   - Displays ordered items, color/size, quantity, and unit price.
   - Shows the 24-hour reservation timer.
   - Displays a prominent action button: `💳 กดชำระเงินและแจ้งที่อยู่` linking directly to the mobile checkout page.
