import {
  and,
  type DatabaseClient,
  db,
  desc,
  eq,
  inArray,
  sql,
} from "@chatbotx.io/database/client"
import {
  contactModel,
  orderItemModel,
  orderModel,
} from "@chatbotx.io/database/schema"
import type { OrderModel } from "@chatbotx.io/database/types"

export type * from "./types"

export class OrderAnalyticsService {
  /**
   * Calculates comprehensive live sales KPIs, product rankings, and conversion rates
   */
  async getLiveSalesAnalytics(
    params: {
      workspaceId: string
      liveSessionId?: string | null
    },
    tx: DatabaseClient = db,
  ): Promise<LiveSalesSummary> {
    const { workspaceId, liveSessionId } = params

    const conditions = [eq(orderModel.workspaceId, workspaceId)]
    if (liveSessionId && liveSessionId !== "all") {
      conditions.push(eq(orderModel.liveSessionId, liveSessionId))
    }

    const whereClause = and(...conditions)

    // 1. Fetch all matching orders
    const ordersWithContact = await tx
      .select({
        order: orderModel,
        contactName: contactModel.fullName,
      })
      .from(orderModel)
      .leftJoin(contactModel, eq(orderModel.contactId, contactModel.id))
      .where(whereClause)
      .orderBy(desc(orderModel.createdAt))

    // 2. Fetch distinct liveSessionIds in this workspace for the filter dropdown
    const distinctSessionsRes = await tx
      .selectDistinct({ liveSessionId: orderModel.liveSessionId })
      .from(orderModel)
      .where(
        and(
          eq(orderModel.workspaceId, workspaceId),
          sql`${orderModel.liveSessionId} IS NOT NULL`,
        ),
      )

    const availableLiveSessions = distinctSessionsRes
      .map((r) => r.liveSessionId)
      .filter((id): id is string => typeof id === "string" && id.length > 0)

    // 3. Compute KPI metrics
    let totalRevenue = 0
    let potentialRevenue = 0
    let paidOrdersCount = 0
    let reservedOrdersCount = 0
    let pendingSlipCount = 0
    let expiredOrdersCount = 0

    const paymentMap: Record<string, { count: number; totalAmount: number }> = {
      bank_transfer: { count: 0, totalAmount: 0 },
      moneyspace_credit_card: { count: 0, totalAmount: 0 },
      qr_code: { count: 0, totalAmount: 0 },
      cod: { count: 0, totalAmount: 0 },
      unpaid: { count: 0, totalAmount: 0 },
    }

    const hourlyMap: Record<
      string,
      { ordersCount: number; paidCount: number; revenue: number }
    > = {}

    const orderIds = ordersWithContact.map((o) => o.order.id)

    for (const { order } of ordersWithContact) {
      const isPaid = ["paid", "packing", "shipped", "completed"].includes(
        order.status,
      )
      const isExpired = ["expired", "cancelled"].includes(order.status)

      if (isPaid) {
        totalRevenue += order.totalAmount
        paidOrdersCount++
      }

      if (!isExpired) {
        potentialRevenue += order.totalAmount
      }

      if (order.status === "reserved") {
        reservedOrdersCount++
      } else if (
        order.status === "pending_payment" ||
        order.paymentStatus === "awaiting_approval"
      ) {
        pendingSlipCount++
      } else if (isExpired) {
        expiredOrdersCount++
      }

      // Payment breakdown
      const methodKey = order.paymentMethod || "unpaid"
      if (!paymentMap[methodKey]) {
        paymentMap[methodKey] = { count: 0, totalAmount: 0 }
      }
      paymentMap[methodKey].count++
      if (isPaid) {
        paymentMap[methodKey].totalAmount += order.totalAmount
      }

      // Timeline hourly bucket
      const date = new Date(order.createdAt)
      const hourStr = `${String(date.getHours()).padStart(2, "0")}:00`
      if (!hourlyMap[hourStr]) {
        hourlyMap[hourStr] = { ordersCount: 0, paidCount: 0, revenue: 0 }
      }
      hourlyMap[hourStr].ordersCount++
      if (isPaid) {
        hourlyMap[hourStr].paidCount++
        hourlyMap[hourStr].revenue += order.totalAmount
      }
    }

    const totalOrders = ordersWithContact.length
    const conversionRate =
      totalOrders > 0 ? Math.round((paidOrdersCount / totalOrders) * 100) : 0
    const averageOrderValue =
      paidOrdersCount > 0 ? Math.round(totalRevenue / paidOrdersCount) : 0

    // 4. Compute Top Selling Products
    let topProducts: TopSellingItem[] = []
    if (orderIds.length > 0) {
      const allItems = await tx
        .select()
        .from(orderItemModel)
        .where(inArray(orderItemModel.orderId, orderIds))

      const productMap: Record<string, TopSellingItem> = {}
      for (const item of allItems) {
        const key = item.sku || `${item.productName}-${item.liveCode || ""}`
        if (!productMap[key]) {
          productMap[key] = {
            productName: item.productName,
            sku: item.sku,
            liveCode: item.liveCode,
            quantity: 0,
            totalRevenue: 0,
          }
        }
        productMap[key].quantity += item.quantity
        productMap[key].totalRevenue += item.unitPrice * item.quantity
      }

      topProducts = Object.values(productMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8)
    }

    // 5. Payment breakdown formatted labels
    const methodLabels: Record<string, string> = {
      bank_transfer: "โอนผ่านธนาคาร (Bank Transfer)",
      moneyspace_credit_card: "บัตรเครดิต (Moneyspace)",
      qr_code: "พร้อมเพย์ / QR Code",
      cod: "เก็บเงินปลายทาง (COD)",
      unpaid: "ยังไม่เลือกชำระเงิน",
    }

    const paymentBreakdown: PaymentMethodStat[] = Object.entries(paymentMap)
      .filter(([_, stat]) => stat.count > 0)
      .map(([method, stat]) => ({
        method,
        label: methodLabels[method] || method,
        count: stat.count,
        totalAmount: stat.totalAmount,
      }))

    // 6. Timeline array
    const timeline: TimelineDataPoint[] = Object.entries(hourlyMap).map(
      ([timeLabel, stat]) => ({
        timeLabel,
        ordersCount: stat.ordersCount,
        paidCount: stat.paidCount,
        revenue: stat.revenue,
      }),
    )

    // 7. Recent orders with item count
    const recentOrders = ordersWithContact
      .slice(0, 10)
      .map(({ order, contactName }) => ({
        ...order,
        contactName,
        itemCount: 1, // default preview
      }))

    return {
      totalRevenue,
      potentialRevenue,
      totalOrders,
      paidOrdersCount,
      reservedOrdersCount,
      pendingSlipCount,
      expiredOrdersCount,
      conversionRate,
      averageOrderValue,
      topProducts,
      paymentBreakdown,
      timeline,
      recentOrders,
      availableLiveSessions,
    }
  }

  /**
   * Generates urgent reminder message for pending live CF orders
   */
  generateReminderMessage(order: OrderModel, checkoutBaseUrl: string): string {
    const expiresMinutes = Math.max(
      0,
      Math.round(
        ((order.expiresAt?.getTime() ?? Date.now()) - Date.now()) / (1000 * 60),
      ),
    )
    const hours = Math.floor(expiresMinutes / 60)
    const mins = expiresMinutes % 60
    const timeText = hours > 0 ? `${hours} ชั่วโมง ${mins} นาที` : `${mins} นาที`

    return `🔥 แจ้งเตือนออเดอร์ใกล้หมดเวลาค่ะ!
คำสั่งซื้อ #${order.orderNumber} ยอดรวม ฿${order.totalAmount.toLocaleString()}
สต็อกที่จองไว้จะหลุดจองภายในอีก ${timeText} นะคะ

กดชำระเงินเพื่อล็อกสินค้าได้ทันทีที่นี่ค่ะ 👇
${checkoutBaseUrl}/checkout/${order.orderToken}`
  }
}

export const orderAnalyticsService = new OrderAnalyticsService()
