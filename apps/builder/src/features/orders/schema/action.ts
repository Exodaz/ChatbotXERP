import {
  orderStatusTypes,
  shippingCarrierTypes,
} from "@chatbotx.io/database/partials"
import { z } from "zod"

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: orderStatusTypes,
})

export const approvePaymentSchema = z.object({
  orderId: z.string().min(1),
})

export const assignTrackingSchema = z.object({
  orderId: z.string().min(1),
  carrier: z.string().min(1),
  trackingNumber: z.string().min(1),
})

export const autoBookCarrierSchema = z.object({
  orderId: z.string().min(1),
  carrier: shippingCarrierTypes,
})
