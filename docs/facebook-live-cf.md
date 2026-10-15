# Facebook Live CF Automation

## How It Works

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant FB as Facebook Page Live
    participant Worker as BullMQ Worker
    participant DB as PostgreSQL
    participant DM as Facebook Messenger

    Customer->>FB: Comments "CF A01 2"
    FB->>Worker: Webhook Event (live_comments)
    Worker->>Worker: Regex Pattern Matching (CF A01 2)
    Worker->>DB: Atomic Stock Reservation
    DB-->>Worker: Success (Reserved 2 units)
    Worker->>DB: Append to Active Live Order
    Worker->>FB: Reply under Comment ("🎉 ได้รับยอดจองแล้วค่ะ")
    Worker->>DM: Private Reply DM (Checkout Link)
    Customer->>DM: Opens Checkout Link & Pays
```

---

## Supported Comment Patterns

The CF Parser recognizes:
- `CF <CODE> <QTY>` (e.g. `CF A01 2`, `cf b12 1`)
- `CF <CODE>x<QTY>` (e.g. `CF A01x2`)
- Thai variations: `ซีเอฟ A01 1`, `จอง A01 2`, `เอา A01 1`
- Single code shorthand: `A01` (when live code matching is enabled)

---

## Meta App Permissions Required

To operate Facebook Live CF automation in production, your Meta App needs:
- `pages_messaging`
- `pages_read_engagement`
- `pages_manage_metadata`
- `pages_read_user_content`
