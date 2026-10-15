"use server"

import { orderService, shippingCarrierService } from "@chatbotx.io/business"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { workspaceActionClient } from "@/lib/safe-action"
import { autoBookCarrierSchema } from "../schema/action"

export const autoBookCarrierAction = workspaceActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .inputSchema(autoBookCarrierSchema)
  .action(async ({ bindArgsParsedInputs: [workspaceId], parsedInput, ctx }) => {
    const order = await orderService.getOrderById(
      parsedInput.orderId,
      workspaceId,
    )
    if (!order) {
      throw new Error("Order not found")
    }

    if (!order.shippingAddress) {
      throw new Error("Shipping address is missing for this order")
    }

    // Default sender info (using workspace name or placeholder)
    const sender = {
      shopName: ctx.workspace.name || "ChatbotX Shop",
      phoneNumber: "020000000",
      addressLine1: "123 Business Road",
      province: "Bangkok",
      postalCode: "10110",
    }

    const itemsSummary = order.items
      .map((i) => `${i.productName} (${i.quantity})`)
      .join(", ")

    const bookingRes = await shippingCarrierService.bookShipment({
      carrier: parsedInput.carrier,
      orderNumber: order.orderNumber,
      sender,
      recipient: {
        name: order.shippingAddress.recipientName,
        phoneNumber: order.shippingAddress.phoneNumber,
        addressLine1: order.shippingAddress.addressLine1,
        subdistrict: order.shippingAddress.subdistrict,
        district: order.shippingAddress.district,
        province: order.shippingAddress.province,
        postalCode: order.shippingAddress.postalCode,
        note: order.shippingAddress.note,
      },
      codAmount: order.paymentMethod === "cod" ? order.totalAmount : undefined,
      itemsSummary,
    })

    if (!(bookingRes.success && bookingRes.trackingNumber)) {
      throw new Error(
        bookingRes.errorMessage || "Failed to book carrier shipment",
      )
    }

    return await orderService.assignTracking(
      order.id,
      workspaceId,
      parsedInput.carrier,
      bookingRes.trackingNumber,
    )
  })
