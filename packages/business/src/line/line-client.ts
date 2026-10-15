import crypto from "node:crypto"
import type { OrderItemModel, OrderModel } from "@chatbotx.io/database/types"

export type LineMessage =
  | { type: "text"; text: string }
  | { type: "flex"; altText: string; contents: Record<string, unknown> }

export interface LineUserProfile {
  displayName: string
  pictureUrl?: string
  statusMessage?: string
  userId: string
}

export class LineClient {
  private readonly baseUrl = "https://api.line.me/v2/bot"

  /**
   * Verifies LINE Webhook signature using HMAC-SHA256
   */
  verifySignature(
    rawBody: string,
    signature: string | null,
    channelSecret: string,
  ): boolean {
    if (!(signature && channelSecret)) {
      return false
    }

    const hash = crypto
      .createHmac("sha256", channelSecret.trim())
      .update(rawBody)
      .digest("base64")

    return hash === signature.trim()
  }

  /**
   * Replies to a user event using replyToken (Free of push message quota)
   */
  async replyMessage(
    replyToken: string,
    messages: LineMessage[],
    accessToken: string,
  ): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/message/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.trim()}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`LINE reply error (${res.status}):`, err)
      return false
    }

    return true
  }

  /**
   * Pushes message to a LINE user by userId
   */
  async pushMessage(
    to: string,
    messages: LineMessage[],
    accessToken: string,
  ): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/message/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.trim()}`,
      },
      body: JSON.stringify({
        to,
        messages,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`LINE push error (${res.status}):`, err)
      return false
    }

    return true
  }

  /**
   * Fetches user profile (Display Name, Picture) from LINE
   */
  async getProfile(
    userId: string,
    accessToken: string,
  ): Promise<LineUserProfile | null> {
    const res = await fetch(`${this.baseUrl}/profile/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
      },
    })

    if (!res.ok) {
      return null
    }

    return await res.json()
  }

  /**
   * Generates a high-converting LINE Flex Message Bubble for CF Order Bill
   */
  buildOrderFlexMessage(
    order: OrderModel,
    items: OrderItemModel[],
    checkoutBaseUrl: string,
  ): LineMessage {
    const checkoutUrl = `${checkoutBaseUrl}/checkout/${order.orderToken}`

    const itemBoxes = items.map((item) => ({
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: `${item.productName} x${item.quantity}`,
          size: "sm",
          color: "#555555",
          flex: 4,
          wrap: true,
        },
        {
          type: "text",
          text: `฿${(item.unitPrice * item.quantity).toLocaleString()}`,
          size: "sm",
          color: "#111111",
          align: "end",
          flex: 2,
          weight: "bold",
        },
      ],
      margin: "md",
    }))

    const flexContents = {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🎉 จองสินค้าสำเร็จ (CF CONFIRMED)",
            weight: "bold",
            color: "#059669",
            size: "sm",
          },
          {
            type: "text",
            text: `ใบสั่งซื้อ #${order.orderNumber}`,
            weight: "bold",
            size: "lg",
            margin: "xs",
          },
        ],
        paddingBottom: "none",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "รายการสินค้าในตะกร้าของคุณ:",
            size: "xs",
            color: "#888888",
            margin: "sm",
          },
          {
            type: "separator",
            margin: "md",
          },
          ...itemBoxes,
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "ยอดรวมทั้งสิ้น",
                weight: "bold",
                size: "md",
              },
              {
                type: "text",
                text: `฿${order.totalAmount.toLocaleString()}`,
                weight: "bold",
                size: "lg",
                color: "#059669",
                align: "end",
              },
            ],
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "⏱️ ระบบล็อกสต็อกไว้ 24 ชั่วโมง กรุณาชำระเงินก่อนหลุดจองนะคะ",
                size: "xxs",
                color: "#b45309",
                wrap: true,
              },
            ],
            backgroundColor: "#fffbeb",
            paddingAll: "sm",
            cornerRadius: "md",
            margin: "md",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "💳 กดชำระเงินและแจ้งที่อยู่",
              uri: checkoutUrl,
            },
            style: "primary",
            color: "#059669",
            height: "sm",
          },
        ],
        paddingTop: "none",
      },
    }

    return {
      type: "flex",
      altText: `ใบสั่งซื้อ #${order.orderNumber} ยอดรวม ฿${order.totalAmount.toLocaleString()}`,
      contents: flexContents,
    }
  }
}

export const lineClient = new LineClient()
