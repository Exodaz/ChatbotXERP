import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
} from "drizzle-orm/pg-core"
import { bigintAsString, sharedColumns } from "../partials/shared"
import { orderModel } from "./order"
import { productModel } from "./product"
import { productVariantModel } from "./product-variant"

export const orderItemModel = pgTable(
  "OrderItem",
  {
    ...sharedColumns,
    orderId: bigintAsString()
      .notNull()
      .references(() => orderModel.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    productId: bigintAsString()
      .notNull()
      .references(() => productModel.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    variantId: bigintAsString().references(() => productVariantModel.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    productName: text().notNull(),
    variantDescription: text(),
    sku: text(),
    liveCode: text(),
    unitPrice: doublePrecision().default(0).notNull(),
    quantity: integer().default(1).notNull(),
    totalPrice: doublePrecision().default(0).notNull(),
  },
  (table) => [
    index("OrderItem_orderId_idx").using(
      "btree",
      table.orderId.asc().nullsLast(),
    ),
    index("OrderItem_productId_idx").on(table.productId),
    index("OrderItem_variantId_idx").on(table.variantId),
  ],
)
