import {
  doublePrecision,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import {
  type OrderShippingAddress,
  type OrderStatusType,
  orderStatusTypes,
  type PaymentMethodType,
  type PaymentStatusType,
  paymentMethodTypes,
  paymentStatusTypes,
} from "../partials/order"
import {
  bigintAsString,
  sharedColumns,
  timestampConfig,
} from "../partials/shared"
import { contactModel } from "./contact"
import { workspaceModel } from "./workspace"

export const orderStatus = pgEnum(
  "orderStatus",
  orderStatusTypes.options as [OrderStatusType, ...OrderStatusType[]],
)

export const paymentMethod = pgEnum(
  "paymentMethod",
  paymentMethodTypes.options as [PaymentMethodType, ...PaymentMethodType[]],
)

export const paymentStatus = pgEnum(
  "paymentStatus",
  paymentStatusTypes.options as [PaymentStatusType, ...PaymentStatusType[]],
)

export const orderModel = pgTable(
  "Order",
  {
    ...sharedColumns,
    workspaceId: bigintAsString()
      .notNull()
      .references(() => workspaceModel.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    contactId: bigintAsString()
      .notNull()
      .references(() => contactModel.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    orderNumber: text().notNull(),
    orderToken: text().notNull(),
    liveSessionId: text(), // Identifier for the Facebook Live broadcast session
    status: orderStatus().default("reserved").notNull(),
    paymentMethod: paymentMethod(),
    paymentStatus: paymentStatus().default("pending").notNull(),

    // Financials
    subtotal: doublePrecision().default(0).notNull(),
    discount: doublePrecision().default(0).notNull(),
    shippingFee: doublePrecision().default(0).notNull(),
    totalAmount: doublePrecision().default(0).notNull(),

    // Payment proof & details
    slipUrl: text(),
    slipVerifiedData: jsonb().$type<Record<string, unknown>>(),
    paymentApprovedBy: bigintAsString(),
    paymentApprovedAt: timestamp(timestampConfig),

    // Shipping info
    shippingAddress: jsonb().$type<OrderShippingAddress>(),
    trackingNumber: text(),
    shippingCarrier: text(),

    // Reservation Expiry
    expiresAt: timestamp(timestampConfig),
  },
  (table) => [
    index("Order_workspaceId_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast(),
    ),
    index("Order_contactId_idx").using(
      "btree",
      table.contactId.asc().nullsLast(),
    ),
    uniqueIndex("Order_workspaceId_orderNumber_key").on(
      table.workspaceId,
      table.orderNumber,
    ),
    uniqueIndex("Order_orderToken_key").on(table.orderToken),
    index("Order_liveSessionId_idx").on(table.liveSessionId),
    index("Order_status_idx").on(table.status),
    index("Order_expiresAt_idx").on(table.expiresAt),
  ],
)
