"use server"

import { stockroomClient, stockSyncService } from "@chatbotx.io/business"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { z } from "zod"
import { workspaceActionClient } from "@/lib/safe-action"

export const pingStockroomAction = workspaceActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .inputSchema(
    z.object({
      apiKey: z.string().min(1, "กรุณาระบุ API Key"),
    }),
  )
  .action(
    async ({ parsedInput }) => await stockroomClient.ping(parsedInput.apiKey),
  )

export const syncStockroomStockAction = workspaceActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .inputSchema(
    z.object({
      apiKey: z.string().min(1, "กรุณาระบุ API Key"),
      category: z.string().optional(),
      overbookingAllowance: z.number().optional(),
    }),
  )
  .action(
    async ({ bindArgsParsedInputs: [workspaceId], parsedInput }) =>
      await stockSyncService.syncStock({
        workspaceId,
        apiKey: parsedInput.apiKey,
        category: parsedInput.category,
        overbookingAllowance: parsedInput.overbookingAllowance ?? 0,
      }),
  )

export const importStockroomCatalogAction = workspaceActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .inputSchema(
    z.object({
      apiKey: z.string().min(1, "กรุณาระบุ API Key"),
      category: z.string().optional(),
    }),
  )
  .action(
    async ({ bindArgsParsedInputs: [workspaceId], parsedInput }) =>
      await stockSyncService.importCatalog({
        workspaceId,
        apiKey: parsedInput.apiKey,
        category: parsedInput.category,
      }),
  )
