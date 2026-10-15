"use server"

import { orderService } from "@chatbotx.io/business"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { workspaceActionClient } from "@/lib/safe-action"
import { approvePaymentSchema } from "../schema/action"

export const approvePaymentAction = workspaceActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .inputSchema(approvePaymentSchema)
  .action(
    async ({ bindArgsParsedInputs: [workspaceId], parsedInput, ctx }) =>
      await orderService.approvePayment(
        parsedInput.orderId,
        workspaceId,
        ctx.user.id,
      ),
  )
