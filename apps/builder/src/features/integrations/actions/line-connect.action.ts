"use server"

import { zodBigintAsString } from "@chatbotx.io/utils"
import { z } from "zod"
import { workspaceActionClient } from "@/lib/safe-action"

export const verifyLineCredentialsAction = workspaceActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .inputSchema(
    z.object({
      channelAccessToken: z.string().min(1, "กรุณาระบุ Channel Access Token"),
    }),
  )
  .action(async ({ parsedInput }) => {
    try {
      const res = await fetch("https://api.line.me/v2/bot/info", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${parsedInput.channelAccessToken.trim()}`,
        },
      })

      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ message: `HTTP ${res.status}` }))
        return {
          success: false,
          error: err.message || "Channel Access Token ไม่ถูกต้องหรือหมดอายุ",
        }
      }

      const botInfo = await res.json()
      return {
        success: true,
        botInfo: {
          userId: botInfo.userId,
          basicId: botInfo.basicId,
          displayName: botInfo.displayName,
          pictureUrl: botInfo.pictureUrl,
          chatMode: botInfo.chatMode,
          markAsReadMode: botInfo.markAsReadMode,
        },
      }
    } catch (err: unknown) {
      return {
        success: false,
        error:
          err instanceof Error ? err.message : "ไม่สามารถเชื่อมต่อ LINE API ได้",
      }
    }
  })
