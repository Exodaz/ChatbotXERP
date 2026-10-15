import {
  and,
  count,
  type DatabaseClient,
  db,
  desc,
  eq,
  ilike,
  inArray,
  lt,
  or,
  sql,
} from "@chatbotx.io/database/client"
import type {
  OrderShippingAddress,
  OrderStatusType,
} from "@chatbotx.io/database/partials"
import {
  contactModel,
  orderItemModel,
  orderModel,
} from "@chatbotx.io/database/schema"
import type { OrderItemModel, OrderModel } from "@chatbotx.io/database/types"
import { createId } from "@chatbotx.io/utils"
import { BaseService } from "../base.service"
import { productVariantService } from "../product"

export type OrderItemInput = {
  productId: string
  variantId?: string | null
  productName: string
  variantDescription?: string | null
  sku?: string | null
  liveCode?: string | null
  unitPrice: number
  quantity: number
}

export type CreateOrAppendLiveOrderInput = {
  workspaceId: string
  contactId: string
  liveSessionId?: string | null
  items: OrderItemInput[]
  expiryHours?: number
}

class OrderService extends BaseService {
  /**
   * Generates a human-friendly unique order number (e.g. ORD-20261015-ABC1)
   */
  private generateOrderNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const randomHex = createId().slice(-4).toUpperCase()
    return `ORD-${dateStr}-${randomHex}`
  }

  /**
   * Finds an active reserved order for the contact in the current live session,
   * or creates a new one, merging newly CF-ed items into a single bill.
   */
  async appendOrCreateLiveOrder(
    input: CreateOrAppendLiveOrderInput,
    tx: DatabaseClient = db,
  ): Promise<{ order: OrderModel; items: OrderItemModel[] }> {
    const {
      workspaceId,
      contactId,
      liveSessionId,
      items,
      expiryHours = 24,
    } = input

    return await (tx === db
      ? db.transaction((t) =>
          this.runAppendOrCreate(
            workspaceId,
            contactId,
            liveSessionId,
            items,
            expiryHours,
            t,
          ),
        )
      : this.runAppendOrCreate(
          workspaceId,
          contactId,
          liveSessionId,
          items,
          expiryHours,
          tx,
        ))
  }

  private async runAppendOrCreate(
    workspaceId: string,
    contactId: string,
    liveSessionId: string | null | undefined,
    items: OrderItemInput[],
    expiryHours: number,
    tx: DatabaseClient,
  ) {
    // 1. Check if there's an existing reserved order for this contact in this live session
    let existingOrder: OrderModel | undefined
    if (liveSessionId) {
      const [found] = await tx
        .select()
        .from(orderModel)
        .where(
          and(
            eq(orderModel.workspaceId, workspaceId),
            eq(orderModel.contactId, contactId),
            eq(orderModel.liveSessionId, liveSessionId),
            eq(orderModel.status, "reserved"),
          ),
        )
      existingOrder = found
    }

    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)

    let order = existingOrder
    if (!order) {
      const orderToken = createId()
      const orderNumber = this.generateOrderNumber()

      const [newOrder] = await tx
        .insert(orderModel)
        .values({
          id: createId(),
          workspaceId,
          contactId,
          orderNumber,
          orderToken,
          liveSessionId: liveSessionId ?? null,
          status: "reserved",
          paymentStatus: "pending",
          subtotal: 0,
          discount: 0,
          shippingFee: 0,
          totalAmount: 0,
          expiresAt,
        })
        .returning()
      order = newOrder
    }

    // 2. Insert items and atomic stock reservations
    for (const item of items) {
      const totalPrice = item.unitPrice * item.quantity
      await tx.insert(orderItemModel).values({
        id: createId(),
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId ?? null,
        productName: item.productName,
        variantDescription: item.variantDescription ?? null,
        sku: item.sku ?? null,
        liveCode: item.liveCode ?? null,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice,
      })

      // Reserve stock in ProductVariant
      if (item.variantId) {
        await productVariantService.reserveStock({
          variantId: item.variantId,
          quantity: item.quantity,
          tx,
        })
      }
    }

    // 3. Recalculate totals
    const allItems = await tx
      .select()
      .from(orderItemModel)
      .where(eq(orderItemModel.orderId, order.id))

    const subtotal = allItems.reduce((acc, curr) => acc + curr.totalPrice, 0)
    const totalAmount = Math.max(
      0,
      subtotal - order.discount + order.shippingFee,
    )

    const [updatedOrder] = await tx
      .update(orderModel)
      .set({
        subtotal,
        totalAmount,
        expiresAt, // extend expiry on new addition
        updatedAt: new Date(),
      })
      .where(eq(orderModel.id, order.id))
      .returning()

    return { order: updatedOrder, items: allItems }
  }

  /**
   * Finds an order by its public secure checkout token
   */
  async findByToken(
    orderToken: string,
    tx: DatabaseClient = db,
  ): Promise<{ order: OrderModel; items: OrderItemModel[] } | null> {
    const [order] = await tx
      .select()
      .from(orderModel)
      .where(eq(orderModel.orderToken, orderToken))

    if (!order) {
      return null
    }

    const items = await tx
      .select()
      .from(orderItemModel)
      .where(eq(orderItemModel.orderId, order.id))

    return { order, items }
  }

  /**
   * Updates shipping address submitted by customer on checkout webview
   */
  async updateShippingAddress(
    orderToken: string,
    address: OrderShippingAddress,
    tx: DatabaseClient = db,
  ): Promise<OrderModel | null> {
    const [updated] = await tx
      .update(orderModel)
      .set({
        shippingAddress: address,
        updatedAt: new Date(),
      })
      .where(eq(orderModel.orderToken, orderToken))
      .returning()

    return updated ?? null
  }

  /**
   * Submits payment proof / slip for bank transfer
   */
  async submitBankTransferSlip(
    orderToken: string,
    slipUrl: string,
    verifiedData?: Record<string, unknown>,
    tx: DatabaseClient = db,
  ): Promise<OrderModel | null> {
    const isAutoVerified = !!verifiedData?.isValid

    const [updated] = await tx
      .update(orderModel)
      .set({
        paymentMethod: "bank_transfer",
        slipUrl,
        slipVerifiedData: verifiedData ?? null,
        paymentStatus: isAutoVerified ? "verified" : "awaiting_approval",
        status: isAutoVerified ? "paid" : "pending_payment",
        updatedAt: new Date(),
      })
      .where(eq(orderModel.orderToken, orderToken))
      .returning()

    return updated ?? null
  }

  /**
   * Confirms payment via Moneyspace credit card webhook / callback
   */
  async confirmMoneyspacePayment(
    orderNumber: string,
    tx: DatabaseClient = db,
  ): Promise<OrderModel | null> {
    const [updated] = await tx
      .update(orderModel)
      .set({
        paymentMethod: "moneyspace_credit_card",
        paymentStatus: "verified",
        status: "paid",
        updatedAt: new Date(),
      })
      .where(eq(orderModel.orderNumber, orderNumber))
      .returning()

    return updated ?? null
  }

  /**
   * Releases stock for orders that have expired past their `expiresAt`
   */
  async processExpiredOrders(tx: DatabaseClient = db): Promise<number> {
    const now = new Date()
    const expiredOrders = await tx
      .select()
      .from(orderModel)
      .where(
        and(eq(orderModel.status, "reserved"), lt(orderModel.expiresAt, now)),
      )

    for (const order of expiredOrders) {
      const items = await tx
        .select()
        .from(orderItemModel)
        .where(eq(orderItemModel.orderId, order.id))

      // Release reserved stock back to available
      for (const item of items) {
        if (item.variantId) {
          await productVariantService.releaseStock({
            variantId: item.variantId,
            quantity: item.quantity,
            tx,
          })
        }
      }

      await tx
        .update(orderModel)
        .set({
          status: "expired",
          updatedAt: new Date(),
        })
        .where(eq(orderModel.id, order.id))
    }

    return expiredOrders.length
  }

  /**
   * Lists orders for a workspace with optional status filter and search query.
   */
  async listOrders(
    params: {
      workspaceId: string
      status?: OrderStatusType
      search?: string
      limit?: number
      offset?: number
    },
    tx: DatabaseClient = db,
  ) {
    const { workspaceId, status, search, limit = 50, offset = 0 } = params

    const conditions = [eq(orderModel.workspaceId, workspaceId)]
    if (status) {
      conditions.push(eq(orderModel.status, status))
    }
    if (search?.trim()) {
      const q = `%${search.trim()}%`
      const searchMatch = or(
        ilike(orderModel.orderNumber, q),
        ilike(orderModel.trackingNumber, q),
        sql`${orderModel.shippingAddress}->>'recipientName' ILIKE ${q}`,
        sql`${orderModel.shippingAddress}->>'phoneNumber' ILIKE ${q}`,
      )
      if (searchMatch) {
        conditions.push(searchMatch)
      }
    }

    const whereClause = and(...conditions)

    const [orders, totalRes] = await Promise.all([
      tx
        .select({
          order: orderModel,
          contact: {
            fullName: contactModel.fullName,
            avatar: contactModel.avatar,
            phoneNumber: contactModel.phoneNumber,
          },
        })
        .from(orderModel)
        .leftJoin(contactModel, eq(orderModel.contactId, contactModel.id))
        .where(whereClause)
        .orderBy(desc(orderModel.createdAt))
        .limit(limit)
        .offset(offset),
      tx.select({ count: count() }).from(orderModel).where(whereClause),
    ])

    const total = totalRes[0]?.count ?? 0

    const orderIds = orders.map((o) => o.order.id)
    let itemsByOrderId: Record<string, OrderItemModel[]> = {}
    if (orderIds.length > 0) {
      const items = await tx
        .select()
        .from(orderItemModel)
        .where(inArray(orderItemModel.orderId, orderIds))

      itemsByOrderId = items.reduce(
        (acc, item) => {
          if (!acc[item.orderId]) {
            acc[item.orderId] = []
          }
          acc[item.orderId].push(item)
          return acc
        },
        {} as Record<string, OrderItemModel[]>,
      )
    }

    return {
      orders: orders.map((o) => ({
        ...o.order,
        contact: o.contact,
        items: itemsByOrderId[o.order.id] ?? [],
      })),
      total,
    }
  }

  /**
   * Retrieves single order by ID with contact and items.
   */
  async getOrderById(
    orderId: string,
    workspaceId: string,
    tx: DatabaseClient = db,
  ) {
    const [found] = await tx
      .select({
        order: orderModel,
        contact: {
          fullName: contactModel.fullName,
          avatar: contactModel.avatar,
          phoneNumber: contactModel.phoneNumber,
        },
      })
      .from(orderModel)
      .leftJoin(contactModel, eq(orderModel.contactId, contactModel.id))
      .where(
        and(
          eq(orderModel.id, orderId),
          eq(orderModel.workspaceId, workspaceId),
        ),
      )

    if (!found) {
      return null
    }

    const items = await tx
      .select()
      .from(orderItemModel)
      .where(eq(orderItemModel.orderId, orderId))

    return {
      ...found.order,
      contact: found.contact,
      items,
    }
  }

  /**
   * Updates order status (e.g. reserved -> paid -> packing -> shipped -> completed).
   */
  async updateOrderStatus(
    orderId: string,
    workspaceId: string,
    status: OrderStatusType,
    tx: DatabaseClient = db,
  ): Promise<OrderModel | null> {
    const [updated] = await tx
      .update(orderModel)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orderModel.id, orderId),
          eq(orderModel.workspaceId, workspaceId),
        ),
      )
      .returning()

    return updated ?? null
  }

  /**
   * Admin approves bank slip / QR code payment manually.
   */
  async approvePayment(
    orderId: string,
    workspaceId: string,
    adminUserId: string,
    tx: DatabaseClient = db,
  ): Promise<OrderModel | null> {
    const [updated] = await tx
      .update(orderModel)
      .set({
        paymentStatus: "verified",
        paymentApprovedBy: adminUserId,
        paymentApprovedAt: new Date(),
        status: "paid",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orderModel.id, orderId),
          eq(orderModel.workspaceId, workspaceId),
        ),
      )
      .returning()

    return updated ?? null
  }

  /**
   * Assigns carrier and tracking number, moving status to 'shipped'.
   */
  async assignTracking(
    orderId: string,
    workspaceId: string,
    carrier: string,
    trackingNumber: string,
    tx: DatabaseClient = db,
  ): Promise<OrderModel | null> {
    const [updated] = await tx
      .update(orderModel)
      .set({
        shippingCarrier: carrier,
        trackingNumber: trackingNumber.trim(),
        status: "shipped",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orderModel.id, orderId),
          eq(orderModel.workspaceId, workspaceId),
        ),
      )
      .returning()

    return updated ?? null
  }

  /**
   * Fetches multiple orders with shipping address & item details for printing labels.
   */
  async getOrdersForPrinting(
    orderIds: string[],
    workspaceId: string,
    tx: DatabaseClient = db,
  ) {
    if (orderIds.length === 0) {
      return []
    }

    const orders = await tx
      .select({
        order: orderModel,
        contact: {
          fullName: contactModel.fullName,
          phoneNumber: contactModel.phoneNumber,
        },
      })
      .from(orderModel)
      .leftJoin(contactModel, eq(orderModel.contactId, contactModel.id))
      .where(
        and(
          inArray(orderModel.id, orderIds),
          eq(orderModel.workspaceId, workspaceId),
        ),
      )

    const items = await tx
      .select()
      .from(orderItemModel)
      .where(inArray(orderItemModel.orderId, orderIds))

    const itemsByOrderId = items.reduce(
      (acc, item) => {
        if (!acc[item.orderId]) {
          acc[item.orderId] = []
        }
        acc[item.orderId].push(item)
        return acc
      },
      {} as Record<string, OrderItemModel[]>,
    )

    return orders.map((o) => ({
      ...o.order,
      contact: o.contact,
      items: itemsByOrderId[o.order.id] ?? [],
    }))
  }
}

export const orderService = new OrderService()
