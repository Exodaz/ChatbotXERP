export interface StockroomKeyInfo {
  name: string
  prefix: string
}

export interface StockroomPingResponse {
  error?: string
  key?: StockroomKeyInfo
  ok: boolean
}

export interface StockroomStockItem {
  available: number
  barcode: string | null
  color: string | null
  price: number
  product: {
    id: string
    name: string
    parentSku: string | null
    brand: string
    category: string
  }
  shipped: number
  size: string | null
  sku: string
  stock: {
    ready: number
    qc: number
    sale: number
    dead: number
  }
  totalArrived: number
  updatedAt: string | null
}

export interface StockroomProductItem {
  brand: string
  category: string
  description: string | null
  id: string
  name: string
  parentSku: string | null
  updatedAt: string | null
  variants: Array<{
    sku: string
    barcode: string | null
    color: string | null
    size: string | null
    price: number
  }>
}

export class StockroomClient {
  private readonly baseUrl: string

  constructor(baseUrl = "https://stockinventory.exodazth.workers.dev/api/v1") {
    this.baseUrl = baseUrl
  }

  /**
   * Pings Stockroom API to verify API key validity
   */
  async ping(apiKey: string): Promise<StockroomPingResponse> {
    const res = await fetch(`${this.baseUrl}/ping`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    })

    if (!res.ok) {
      const errBody = await res
        .json()
        .catch(() => ({ error: `HTTP ${res.status}` }))
      return {
        ok: false,
        error: errBody.error || `Failed with status ${res.status}`,
      }
    }

    return await res.json()
  }

  /**
   * Fetches single page of stock data
   */
  async fetchStockPage(params: {
    apiKey: string
    cursor?: string | null
    limit?: number
    updated_since?: string
    category?: string
    sku?: string[]
  }): Promise<{ data: StockroomStockItem[]; nextCursor: string | null }> {
    const { apiKey, cursor, limit = 500, updated_since, category, sku } = params

    const query = new URLSearchParams()
    query.set("limit", String(limit))
    if (cursor) {
      query.set("cursor", cursor)
    }
    if (updated_since) {
      query.set("updated_since", updated_since)
    }
    if (category) {
      query.set("category", category)
    }
    if (sku && sku.length > 0) {
      query.set("sku", sku.slice(0, 100).join(","))
    }

    const res = await fetch(`${this.baseUrl}/stock?${query.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Stockroom API Error (${res.status}): ${err}`)
    }

    return await res.json()
  }

  /**
   * Recursively fetches all stock records traversing nextCursor
   */
  async fetchAllStock(params: {
    apiKey: string
    updated_since?: string
    category?: string
  }): Promise<StockroomStockItem[]> {
    const { apiKey, updated_since, category } = params
    const allItems: StockroomStockItem[] = []
    let cursor: string | null = null

    do {
      const page = await this.fetchStockPage({
        apiKey,
        cursor,
        limit: 1000,
        updated_since,
        category,
      })
      allItems.push(...page.data)
      cursor = page.nextCursor
    } while (cursor)

    return allItems
  }

  /**
   * Fetches product catalog with variants
   */
  async fetchProductsPage(params: {
    apiKey: string
    cursor?: string | null
    limit?: number
    category?: string
  }): Promise<{ data: StockroomProductItem[]; nextCursor: string | null }> {
    const { apiKey, cursor, limit = 500, category } = params

    const query = new URLSearchParams()
    query.set("limit", String(limit))
    if (cursor) {
      query.set("cursor", cursor)
    }
    if (category) {
      query.set("category", category)
    }

    const res = await fetch(`${this.baseUrl}/products?${query.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Stockroom Products API Error (${res.status}): ${err}`)
    }

    return await res.json()
  }
}

export const stockroomClient = new StockroomClient()
