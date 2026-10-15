"use server"

import { orderService } from "@chatbotx.io/business"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { workspaceActionClient } from "@/lib/safe-action"
import { assignTrackingSchema } from "../schema/action"

export const assignTrackingAction = workspaceActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .inputSchema(assignTrackingSchema)
  .action(
    async ({ bindArgsParsedInputs: [workspaceId], parsedInput }) =>
      await orderService.assignTracking(
        parsedInput.orderId,
        workspaceId,
        parsedInput.carrier,
        parsedInput.trackingNumber,
      ),
  )
