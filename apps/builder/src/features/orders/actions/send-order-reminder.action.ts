"use server"

import { orderAnalyticsService, orderService } from "@chatbotx.io/business"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { z } from "zod"
import { workspaceActionClient } from "@/lib/safe-action"

export const sendOrderReminderAction = workspaceActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .inputSchema(z.object({ orderId: z.string().min(1) }))
  .action(async ({ bindArgsParsedInputs: [workspaceId], parsedInput }) => {
    const order = await orderService.getOrderById(
      parsedInput.orderId,
      workspaceId,
    )
    if (!order) {
      throw new Error("Order not found")
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3123"
    const message = orderAnalyticsService.generateReminderMessage(order, appUrl)

    // Return the reminder details for display or dispatch
    return {
      success: true,
      orderNumber: order.orderNumber,
      message,
    }
  })
