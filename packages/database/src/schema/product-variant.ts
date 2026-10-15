import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
} from "drizzle-orm/pg-core"
import { bigintAsString, sharedColumns } from "../partials/shared"
import { productModel } from "./product"

export const productVariantModel = pgTable(
  "ProductVariant",
  {
    ...sharedColumns,
    productId: bigintAsString()
      .notNull()
      .references(() => productModel.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    combination: jsonb().$type<Record<string, string>>().notNull(),
    sku: text(),
    /** Live shortcode used for Facebook Live CF (e.g. 'A12') */
    liveCode: text(),
    price: doublePrecision().default(0).notNull(),
    /** Stock ready to ship immediately */
    availableQuantity: integer().default(0).notNull(),
    /** Stock in-transit / incoming */
    incomingQuantity: integer().default(0).notNull(),
    /** Max allowed backorder/reservation ceiling (lovegoo cap or available + incoming) */
    maxCapQuantity: integer().default(0).notNull(),
    /** Quantity currently reserved by customer CFs */
    reservedQuantity: integer().default(0).notNull(),
    isEnabled: boolean().default(true).notNull(),
  },
  (table) => [
    index("ProductVariant_productId_idx").using(
      "btree",
      table.productId.asc().nullsLast(),
    ),
  ],
)
