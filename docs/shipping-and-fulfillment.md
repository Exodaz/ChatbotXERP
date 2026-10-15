# Shipping & Fulfillment

## Supported Carriers

ChatbotXERP integrates tracking URL generators and validation for 5 major carriers:

1. **Flash Express**: `https://www.flashexpress.co.th/tracking/?se=`
2. **J&T Express**: `https://www.jtexpress.co.th/trajectoryQuery?bills=`
3. **Kerry Express**: `https://th.kerryexpress.com/th/track/?track=`
4. **Thailand Post (ไปรษณีย์ไทย)**: `https://track.thailandpost.co.th/?trackNumber=`
5. **SPX Express (Shopee Xpress)**: `https://spx.co.th/`

---

## Thermal Shipping Labels (100x150 mm)

Accessible at `/space/[workspaceId]/orders/print?ids=[id1,id2]`:

- **Dimensions**: Standard 100 x 150 mm (4 x 6 inches) direct thermal sticker.
- **Components**:
  - Sender / Shipper details.
  - Recipient delivery address and telephone.
  - Tracking Number with high-contrast **SVG Vector Barcode**.
  - **Packing Checklist**: SKU breakdown, variant color/size, and quantity to ensure error-free warehouse packing.
- **Multi-Order Batch Print**: Print 50+ packing labels in a single PDF/print dialog.
