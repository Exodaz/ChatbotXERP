import { describe, expect, it, vi } from "vitest"
import { StockroomClient } from "../src/stock-sync/stockroom-client"

describe("Stockroom Integration & Stock Sync", () => {
  it("constructs correct query parameters for stock fetch", async () => {
    const client = new StockroomClient(
      "https://stockinventory.exodazth.workers.dev/api/v1",
    )

    // Mock global fetch
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            sku: "LGA-LAWR-GOL",
            barcode: null,
            product: {
              id: "p_lawrence",
              name: "Lawrence",
              brand: "LoveGood",
              category: "Belts",
            },
            color: "Gold",
            size: null,
            price: 590,
            available: 10,
            stock: { ready: 10, qc: 5, sale: 0, dead: 0 },
            totalArrived: 15,
            shipped: 0,
            updatedAt: "2026-08-13T04:27:42Z",
          },
        ],
        nextCursor: null,
      }),
    })
    global.fetch = fetchMock

    const res = await client.fetchStockPage({
      apiKey: "sk_test123",
      limit: 100,
      category: "Belts",
    })

    expect(fetchMock).toHaveBeenCalled()
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain("category=Belts")
    expect(calledUrl).toContain("limit=100")

    const calledHeaders = fetchMock.mock.calls[0][1]?.headers as Record<
      string,
      string
    >
    expect(calledHeaders.Authorization).toBe("Bearer sk_test123")

    expect(res.data).toHaveLength(1)
    expect(res.data[0].available).toBe(10)
    expect(res.data[0].stock.qc).toBe(5)
  })

  it("handles ping error when API key is invalid", async () => {
    const client = new StockroomClient(
      "https://stockinventory.exodazth.workers.dev/api/v1",
    )

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Invalid or missing API key" }),
    })

    const res = await client.ping("sk_invalid")
    expect(res.ok).toBe(false)
    expect(res.error).toBe("Invalid or missing API key")
  })
})
