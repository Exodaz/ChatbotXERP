import { describe, expect, it } from "vitest"
import { getTrackingUrl, shippingCarrierService } from "../src/shipping"

const FLASH_TRACKING_REGEX = /^TH\d+F$/

describe("Shipping Carriers & Fulfillment", () => {
  it("resolves tracking URLs correctly for supported carriers", () => {
    expect(getTrackingUrl("flash_express", "TH0123456789")).toBe(
      "https://www.flashexpress.co.th/tracking/?se=TH0123456789",
    )
    expect(getTrackingUrl("jt_express", "820123456789")).toBe(
      "https://www.jtexpress.co.th/trajectoryQuery?bills=820123456789",
    )
    expect(getTrackingUrl("kerry_express", "KEX0123456789")).toBe(
      "https://th.kerryexpress.com/th/track/?track=KEX0123456789",
    )
    expect(getTrackingUrl("thailand_post", "ED123456789TH")).toBe(
      "https://track.thailandpost.co.th/?trackNumber=ED123456789TH",
    )
    expect(getTrackingUrl("spx_express", "SPXTH0123456789")).toBe(
      "https://spx.co.th/m/track?tracking_number=SPXTH0123456789",
    )
    expect(getTrackingUrl("other", "CUSTOM123")).toBeNull()
  })

  it("handles whitespace and special characters in tracking numbers", () => {
    expect(getTrackingUrl("flash_express", "  TH0123 456789  ")).toBe(
      "https://www.flashexpress.co.th/tracking/?se=TH0123%20456789",
    )
  })

  it("generates carrier standard tracking numbers on booking", async () => {
    const bookingRes = await shippingCarrierService.bookShipment({
      carrier: "flash_express",
      orderNumber: "ORD-20261015-TEST1",
      sender: {
        shopName: "My Shop",
        phoneNumber: "0812345678",
        addressLine1: "123 Shop St",
        province: "Bangkok",
        postalCode: "10110",
      },
      recipient: {
        name: "สมหญิง จริงใจ",
        phoneNumber: "0899999999",
        addressLine1: "456 Sukhumvit Rd",
        province: "Bangkok",
        postalCode: "10110",
      },
      itemsSummary: "เสื้อแฟชั่น x 1",
    })

    expect(bookingRes.success).toBe(true)
    expect(bookingRes.trackingNumber).toMatch(FLASH_TRACKING_REGEX)
  })
})
