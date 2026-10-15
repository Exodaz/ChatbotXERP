# Stock & Flexible Cap System

## The Challenge in Live Selling

In high-volume live commerce (such as fashion bags, shoes, and clothing), physical stock in the warehouse is often limited, but incoming supplier shipments are expected within days. 

Standard e-commerce platforms either:
1. Block sales as soon as physical stock reaches zero (losing high-intent live buyers).
2. Allow unlimited overselling (resulting in unfillable orders).

ChatbotXERP solves this with a **Flexible Overbooking / Backorder Cap**.

---

## Data Model

Each product variant (`ProductVariant`) maintains three core inventory fields:

| Field | Type | Description |
| :--- | :--- | :--- |
| `quantity` | `number` | Physical available inventory on warehouse shelves. |
| `reservedQuantity` | `number` | Stock currently held by unconfirmed or unexpired live orders. |
| `maxCapQuantity` | `number \| null` | Maximum allowable reservations (including incoming shipments). |

---

## Atomic Reservation Logic

When a customer comments `CF A01 1`:

```
Requested: Q
Max Cap: maxCapQuantity ?? quantity
Currently Reserved: reservedQuantity

Can Reserve IF:
  reservedQuantity + Q <= Max Cap
```

If the condition is met:
1. In a PostgreSQL row transaction, `reservedQuantity` is atomically incremented by `Q`.
2. An order is created or updated in `reserved` status with an expiration timestamp (`expiresAt = now + 24h`).
3. If `quantity` is insufficient, the system accepts the order as an overbooking up to `maxCapQuantity`.

---

## Stock Release & Expiration

If the customer does not complete checkout within the reservation window:
- A BullMQ scheduler sweeps the database every 5 minutes.
- Expired orders are updated to `status = 'expired'`.
- `reservedQuantity` is decremented by the released amount, making the item immediately available for waitlisted buyers.
