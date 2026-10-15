import type { OrderModel } from "@chatbotx.io/database/types"

export interface TopSellingItem {
  liveCode: string | null
  productName: string
  quantity: number
  sku: string | null
  totalRevenue: number
}

export interface PaymentMethodStat {
  count: number
  label: string
  method: string
  totalAmount: number
}

export interface TimelineDataPoint {
  ordersCount: number
  paidCount: number
  revenue: number
  timeLabel: string
}

export interface LiveSalesSummary {
  availableLiveSessions: string[]
  averageOrderValue: number
  conversionRate: number
  expiredOrdersCount: number
  paidOrdersCount: number
  paymentBreakdown: PaymentMethodStat[]
  pendingSlipCount: number
  potentialRevenue: number
  recentOrders: (OrderModel & {
    contactName: string | null
    itemCount: number
  })[]
  reservedOrdersCount: number
  timeline: TimelineDataPoint[]
  topProducts: TopSellingItem[]
  totalOrders: number
  totalRevenue: number
}
