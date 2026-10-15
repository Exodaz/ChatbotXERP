import { and, type DatabaseClient, db, eq } from "@chatbotx.io/database/client"
import { contactModel } from "@chatbotx.io/database/schema"
import type { ContactModel } from "@chatbotx.io/database/types"
import { createId } from "@chatbotx.io/utils"
import { BaseService } from "../base.service"
import { parseLiveCFComment } from "../order/cf-parser"
import { orderService } from "../order/service"
import { productVariantService } from "../product/service"
import { lineClient } from "./line-client"

export interface LineEvent {
  message?: {
    id: string
    type: string
    text?: string
  }
  mode?: string
  postback?: {
    data: string
  }
  replyToken?: string
  source: {
    type: "user" | "group" | "room"
    userId?: string
  }
  timestamp: number
  type: "message" | "follow" | "unfollow" | "postback"
}

export class LineCFHandler extends BaseService {
  /**
   * Finds or creates a contact for a LINE user
   */
  async findOrCreateContact(
    workspaceId: string,
    lineUserId: string,
    accessToken?: string,
    tx: DatabaseClient = db,
  ): Promise<ContactModel> {
    // Try to find by contact notes or matching identity
    const [existing] = await tx
      .select()
      .from(contactModel)
      .where(
        and(
          eq(contactModel.workspaceId, workspaceId),
          eq(contactModel.firstName, `LINE: ${lineUserId}`),
        ),
      )

    if (existing) {
      return existing
    }

    // Try fetching profile from LINE
    let displayName = "LINE User"
    let avatarUrl: string | null = null

    if (accessToken) {
      const profile = await lineClient.getProfile(lineUserId, accessToken)
      if (profile) {
        displayName = profile.displayName
        avatarUrl = profile.pictureUrl || null
      }
    }

    const [created] = await tx
      .insert(contactModel)
      .values({
        id: createId(),
        workspaceId,
        firstName: displayName,
        lastName: `(${lineUserId.slice(-4)})`,
        avatar: avatarUrl,
      })
      .returning()

    return created
  }

  /**
   * Handles incoming webhook events from LINE OA
   */
  async handleEvents(input: {
    workspaceId: string
    channelAccessToken: string
    events: LineEvent[]
    liveSessionId?: string | null
    appUrl: string
  }): Promise<{ processed: number; cfCount: number }> {
    const { workspaceId, channelAccessToken, events, liveSessionId, appUrl } =
      input

    let processed = 0
    let cfCount = 0

    for (const event of events) {
      processed++
      const lineUserId = event.source.userId
      if (!(lineUserId && event.replyToken)) {
        continue
      }

      // 1. Handle Follow Event (User adds LINE OA as friend)
      if (event.type === "follow") {
        const contact = await this.findOrCreateContact(
          workspaceId,
          lineUserId,
          channelAccessToken,
        )

        await lineClient.replyMessage(
          event.replyToken,
          [
            {
              type: "text",
              text: `สวัสดีค่ะคุณ ${contact.fullName || ""} ขอบคุณที่เพิ่มเพื่อนกับทางร้านนะคะ! 🎉\n\nสามารถสั่งซื้อสินค้า หรือพิมพ์ CF ตามด้วยรหัสสินค้าในแชตนี้ได้ตลอด 24 ชม. เลยค่ะ เช่น "CF A01 1"`,
            },
          ],
          channelAccessToken,
        )
        continue
      }

      // 2. Handle Message Event (CF order parsing)
      if (
        event.type === "message" &&
        event.message?.type === "text" &&
        event.message.text
      ) {
        const text = event.message.text.trim()
        const cfResult = parseLiveCFComment(text)

        if (!(cfResult.isCF && cfResult.liveCode)) {
          // Regular customer question / chat: could be routed to inbox
          continue
        }

        // Resolving variant by liveCode or SKU
        const found = await productVariantService.findByLiveCode({
          workspaceId,
          liveCode: cfResult.liveCode,
        })

        if (!found) {
          await lineClient.replyMessage(
            event.replyToken,
            [
              {
                type: "text",
                text: `ขออภัยค่ะ ไม่พบสินค้ารหัส "${cfResult.liveCode}" ในระบบ กรุณาตรวจสอบรหัสสินค้าอีกครั้งนะคะ`,
              },
            ],
            channelAccessToken,
          )
          continue
        }

        const { variant, product } = found

        // 3. Atomically reserve stock
        const reserveRes = await productVariantService.reserveStock({
          variantId: variant.id,
          quantity: cfResult.quantity,
        })

        if (!reserveRes.success) {
          await lineClient.replyMessage(
            event.replyToken,
            [
              {
                type: "text",
                text: `ขออภัยค่ะ สินค้ารหัส "${cfResult.liveCode}" ตอนนี้ยอดจองเต็มโควตาแล้วนะคะ หากมีลูกค้าท่านอื่นหลุดจอง ระบบจะแจ้งเตือนทันทีค่ะ! 📦`,
              },
            ],
            channelAccessToken,
          )
          continue
        }

        // 4. Contact resolution & Order creation/append
        const contact = await this.findOrCreateContact(
          workspaceId,
          lineUserId,
          channelAccessToken,
        )

        const { order, items } = await orderService.appendOrCreateLiveOrder({
          workspaceId,
          contactId: contact.id,
          liveSessionId:
            liveSessionId || `LINE-CF-${new Date().toISOString().slice(0, 10)}`,
          items: [
            {
              productId: variant.productId,
              variantId: variant.id,
              productName: product.name,
              variantDescription: Object.values(variant.combination || {}).join(
                " / ",
              ),
              sku: variant.sku,
              liveCode: variant.liveCode,
              unitPrice: variant.price,
              quantity: cfResult.quantity,
            },
          ],
        })

        cfCount++

        // 5. Send rich LINE Flex Message with interactive checkout button
        const flexMessage = lineClient.buildOrderFlexMessage(
          order,
          items,
          appUrl,
        )
        await lineClient.replyMessage(
          event.replyToken,
          [flexMessage],
          channelAccessToken,
        )
      }
    }

    return { processed, cfCount }
  }
}

export const lineCFHandler = new LineCFHandler()
