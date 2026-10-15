import crypto from "node:crypto"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { lineCFHandler } from "../src/line/line-cf-handler"
import { lineClient } from "../src/line/line-client"
import { orderService } from "../src/order/service"
import { productVariantService } from "../src/product/service"

describe("LINE OA Client & CF Handler", () => {
  const channelSecret = "test_channel_secret_12345"
  const channelAccessToken = "test_access_token_abcdef"

  describe("LineClient.verifySignature", () => {
    it("should return true for valid HMAC-SHA256 signature", () => {
      const rawBody = JSON.stringify({ events: [{ type: "message" }] })
      const validSignature = crypto
        .createHmac("sha256", channelSecret)
        .update(rawBody)
        .digest("base64")

      const isValid = lineClient.verifySignature(
        rawBody,
        validSignature,
        channelSecret,
      )
      expect(isValid).toBe(true)
    })

    it("should return false for invalid signature or tampered body", () => {
      const rawBody = JSON.stringify({ events: [{ type: "message" }] })
      const isValid = lineClient.verifySignature(
        rawBody,
        "wrong_signature",
        channelSecret,
      )
      expect(isValid).toBe(false)
    })

    it("should return false when signature or secret is missing", () => {
      expect(lineClient.verifySignature("{}", null, channelSecret)).toBe(false)
      expect(lineClient.verifySignature("{}", "sig", "")).toBe(false)
    })
  })

  describe("LineClient.buildOrderFlexMessage", () => {
    it("should generate a valid LINE Flex Message with checkout URI button", () => {
      const mockOrder: any = {
        id: "order_1",
        orderNumber: "ORD-2026-0001",
        orderToken: "tok_test123",
        totalAmount: 1590,
      }
      const mockItems: any = [
        {
          id: "item_1",
          productName: "Sneakers Runner",
          variantDescription: "White / 42",
          quantity: 1,
          unitPrice: 1590,
        },
      ]

      const flexMsg = lineClient.buildOrderFlexMessage(
        mockOrder,
        mockItems,
        "https://app.example.com",
      )

      expect(flexMsg.type).toBe("flex")
      expect(flexMsg.altText).toContain("ORD-2026-0001")
      expect(flexMsg.altText).toContain("1,590")

      const contents: any = flexMsg.contents
      expect(contents.type).toBe("bubble")
      expect(contents.header.contents[0].text).toContain("CF CONFIRMED")

      // Button in footer
      const button = contents.footer.contents[0]
      expect(button.type).toBe("button")
      expect(button.action.uri).toBe(
        "https://app.example.com/checkout/tok_test123",
      )
    })
  })

  describe("LineCFHandler.handleEvents", () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it("should handle follow event and send welcome greeting", async () => {
      const replySpy = vi
        .spyOn(lineClient, "replyMessage")
        .mockResolvedValue(true)
      vi.spyOn(lineCFHandler, "findOrCreateContact").mockResolvedValue({
        id: "c_1",
        fullName: "Somchai",
      } as any)

      const res = await lineCFHandler.handleEvents({
        workspaceId: "ws_1",
        channelAccessToken,
        events: [
          {
            type: "follow",
            timestamp: Date.now(),
            replyToken: "reply_tok_1",
            source: { type: "user", userId: "u_line_1" },
          },
        ],
        appUrl: "https://app.example.com",
      })

      expect(res.processed).toBe(1)
      expect(res.cfCount).toBe(0)
      expect(replySpy).toHaveBeenCalledWith(
        "reply_tok_1",
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining("ขอบคุณที่เพิ่มเพื่อนกับทางร้านนะคะ"),
          }),
        ]),
        channelAccessToken,
      )
    })

    it("should parse CF comment, reserve stock, create order, and reply with Flex Message", async () => {
      const replySpy = vi
        .spyOn(lineClient, "replyMessage")
        .mockResolvedValue(true)
      vi.spyOn(lineCFHandler, "findOrCreateContact").mockResolvedValue({
        id: "c_1",
        fullName: "Somchai",
      } as any)

      vi.spyOn(productVariantService, "findByLiveCode").mockResolvedValue({
        variant: {
          id: "var_1",
          productId: "prod_1",
          sku: "SNK-WHT-42",
          liveCode: "A01",
          price: 1290,
          combination: { color: "White", size: "42" },
        } as any,
        product: {
          id: "prod_1",
          name: "Sneakers Pro",
        } as any,
      })

      vi.spyOn(productVariantService, "reserveStock").mockResolvedValue({
        success: true,
        reservedQuantity: 2,
        isOverbooked: false,
      })

      vi.spyOn(orderService, "appendOrCreateLiveOrder").mockResolvedValue({
        order: {
          id: "ord_1",
          orderNumber: "ORD-9999",
          orderToken: "token_abc",
          totalAmount: 2580,
        } as any,
        items: [
          {
            id: "item_1",
            productName: "Sneakers Pro",
            quantity: 2,
            unitPrice: 1290,
          } as any,
        ],
      })

      const res = await lineCFHandler.handleEvents({
        workspaceId: "ws_1",
        channelAccessToken,
        events: [
          {
            type: "message",
            timestamp: Date.now(),
            replyToken: "reply_tok_2",
            source: { type: "user", userId: "u_line_1" },
            message: { id: "m_1", type: "text", text: "CF A01 2" },
          },
        ],
        appUrl: "https://app.example.com",
      })

      expect(res.processed).toBe(1)
      expect(res.cfCount).toBe(1)
      expect(productVariantService.reserveStock).toHaveBeenCalledWith({
        variantId: "var_1",
        quantity: 2,
      })
      expect(replySpy).toHaveBeenCalledWith(
        "reply_tok_2",
        expect.arrayContaining([
          expect.objectContaining({
            type: "flex",
          }),
        ]),
        channelAccessToken,
      )
    })

    it("should reply out of stock when quota is full", async () => {
      const replySpy = vi
        .spyOn(lineClient, "replyMessage")
        .mockResolvedValue(true)

      vi.spyOn(productVariantService, "findByLiveCode").mockResolvedValue({
        variant: { id: "var_1", liveCode: "B02" } as any,
        product: { id: "prod_1", name: "Shirt" } as any,
      })

      vi.spyOn(productVariantService, "reserveStock").mockResolvedValue({
        success: false,
        error: "STOCK_EXCEEDED",
      })

      const res = await lineCFHandler.handleEvents({
        workspaceId: "ws_1",
        channelAccessToken,
        events: [
          {
            type: "message",
            timestamp: Date.now(),
            replyToken: "reply_tok_3",
            source: { type: "user", userId: "u_line_1" },
            message: { id: "m_2", type: "text", text: "CF B02 1" },
          },
        ],
        appUrl: "https://app.example.com",
      })

      expect(res.cfCount).toBe(0)
      expect(replySpy).toHaveBeenCalledWith(
        "reply_tok_3",
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining("ยอดจองเต็มโควตาแล้วนะคะ"),
          }),
        ]),
        channelAccessToken,
      )
    })
  })
})
