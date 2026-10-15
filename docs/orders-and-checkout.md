# Orders & Web Checkout

## Combined Bill (Multi-Item Order Merging)

During a Facebook Live or LINE OA session, a customer often orders multiple items across the broadcast (e.g. `CF A01 1` at minute 10, then `CF B05 2` at minute 35).

ChatbotXERP automatically merges these into a single active order:
- Looks up existing order where `status = 'reserved'` for the same `contactId` and `liveSessionId`.
- Appends new items to the bill.
- Extends the 24h reservation timer.
- Re-sends an updated checkout link with the new subtotal.

---

## Web Checkout Portal (`/checkout/[orderToken]`)

Customers receive a secure link to the checkout page:

```
https://your-domain.com/checkout/f47ac10b58cc4372a5670e02b2c3d479
```

### Checkout Steps:
1. **Order Summary**: Shows reserved products, quantities, prices, and countdown timer.
2. **Delivery Information**: Recipient name, mobile phone number, and address fields.
3. **Payment Selection**:
   - **Bank Transfer**: Customer uploads payment slip; validated automatically via **Easyslip API** (amount, destination bank account, and slip hash check).
   - **Credit Card**: Customer pays online via **Moneyspace Payment Gateway**.
4. **Order Confirmation**: Instant receipt page with live order status updates.
