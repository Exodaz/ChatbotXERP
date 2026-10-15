"use server"

import { orderService } from "@chatbotx.io/business"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { workspaceActionClient } from "@/lib/safe-action"
import { updateOrderStatusSchema } from "../schema/action"

export const updateOrderStatusAction = workspaceActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .inputSchema(updateOrderStatusSchema)
  .action(
    async ({ bindArgsParsedInputs: [workspaceId], parsedInput }) =>
      await orderService.updateOrderStatus(
        parsedInput.orderId,
        workspaceId,
        parsedInput.status,
      ),
  )
