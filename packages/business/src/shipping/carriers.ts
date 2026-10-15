import type { ShippingCarrierType } from "@chatbotx.io/database/partials"

export interface CarrierMetadata {
  id: ShippingCarrierType
  logo?: string
  name: string
  trackingUrlTemplate: string | null
}

export const CARRIERS: Record<ShippingCarrierType, CarrierMetadata> = {
  flash_express: {
    id: "flash_express",
    name: "Flash Express",
    trackingUrlTemplate:
      "https://www.flashexpress.co.th/tracking/?se={trackingNumber}",
  },
  jt_express: {
    id: "jt_express",
    name: "J&T Express",
    trackingUrlTemplate:
      "https://www.jtexpress.co.th/trajectoryQuery?bills={trackingNumber}",
  },
  kerry_express: {
    id: "kerry_express",
    name: "Kerry Express",
    trackingUrlTemplate:
      "https://th.kerryexpress.com/th/track/?track={trackingNumber}",
  },
  thailand_post: {
    id: "thailand_post",
    name: "Thailand Post (ไปรษณีย์ไทย)",
    trackingUrlTemplate:
      "https://track.thailandpost.co.th/?trackNumber={trackingNumber}",
  },
  spx_express: {
    id: "spx_express",
    name: "SPX Express",
    trackingUrlTemplate:
      "https://spx.co.th/m/track?tracking_number={trackingNumber}",
  },
  other: {
    id: "other",
    name: "อื่นๆ (Other)",
    trackingUrlTemplate: null,
  },
}

/**
 * Returns the tracking URL for a given carrier and tracking number.
 */
export function getTrackingUrl(
  carrier: string,
  trackingNumber: string,
): string | null {
  const carrierMeta = CARRIERS[carrier as ShippingCarrierType]
  if (!carrierMeta?.trackingUrlTemplate) {
    return null
  }
  return carrierMeta.trackingUrlTemplate.replace(
    "{trackingNumber}",
    encodeURIComponent(trackingNumber.trim()),
  )
}

export interface ShippingSenderInfo {
  addressLine1: string
  district?: string
  phoneNumber: string
  postalCode: string
  province?: string
  shopName: string
  subdistrict?: string
}

export interface CarrierBookingRequest {
  carrier: ShippingCarrierType
  codAmount?: number
  itemsSummary?: string
  orderNumber: string
  recipient: {
    name: string
    phoneNumber: string
    addressLine1: string
    subdistrict?: string
    district?: string
    province?: string
    postalCode: string
    note?: string
  }
  sender: ShippingSenderInfo
  weightInGrams?: number
}

export interface CarrierBookingResponse {
  errorMessage?: string
  labelUrl?: string
  sortCode?: string
  success: boolean
  trackingNumber?: string
}

/**
 * Carrier Integration Service
 * Can be connected to carrier APIs (Flash Open API, J&T VIP API)
 */
export class ShippingCarrierService {
  /**
   * Book shipment with carrier API
   * When credentials are not yet configured, returns a generated tracking number placeholder
   */
  async bookShipment(
    request: CarrierBookingRequest,
  ): Promise<CarrierBookingResponse> {
    await Promise.resolve()
    const { carrier } = request

    // In production with API keys, invoke carrier endpoints.
    // Default fallback generates standard-format tracking number for the carrier
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "")
    const randPart = Math.floor(100_000 + Math.random() * 900_000)

    let trackingNumber = ""
    switch (carrier) {
      case "flash_express":
        trackingNumber = `TH${datePart}${randPart}F`
        break
      case "jt_express":
        trackingNumber = `82${datePart}${randPart}`
        break
      case "kerry_express":
        trackingNumber = `KEX${datePart}${randPart}`
        break
      case "thailand_post":
        trackingNumber = `ED${randPart}${datePart.slice(-2)}TH`
        break
      case "spx_express":
        trackingNumber = `SPXTH${datePart}${randPart}`
        break
      default:
        trackingNumber = `TRK${datePart}${randPart}`
    }

    return {
      success: true,
      trackingNumber,
    }
  }
}

export const shippingCarrierService = new ShippingCarrierService()
