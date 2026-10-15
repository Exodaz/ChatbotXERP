import type { OrderModel } from "@chatbotx.io/database/types"
import { describe, expect, it } from "vitest"
import { orderAnalyticsService } from "../src/order/analytics"

describe("OrderAnalyticsService", () => {
  it("generates correct Thai reminder message with checkout link and expiry", () => {
    const mockOrder: OrderModel = {
      id: "ord-1",
      workspaceId: "ws-1",
      contactId: "ct-1",
      orderNumber: "ORD-20261015-XYZ1",
      orderToken: "abc123token",
      liveSessionId: "LIVE-01",
      status: "reserved",
      paymentMethod: null,
      paymentStatus: "pending",
      subtotal: 1000,
      discount: 0,
      shippingFee: 50,
      totalAmount: 1050,
      slipUrl: null,
      slipVerifiedData: null,
      paymentApprovedBy: null,
      paymentApprovedAt: null,
      shippingAddress: null,
      trackingNumber: null,
      shippingCarrier: null,
      expiresAt: new Date(Date.now() + 90 * 60 * 1000), // 1 hour 30 mins from now
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const message = orderAnalyticsService.generateReminderMessage(
      mockOrder,
      "https://app.chatbotx.com",
    )

    expect(message).toContain("คำสั่งซื้อ #ORD-20261015-XYZ1")
    expect(message).toContain("฿1,050")
    expect(message).toContain("1 ชั่วโมง")
    expect(message).toContain("https://app.chatbotx.com/checkout/abc123token")
  })
})
