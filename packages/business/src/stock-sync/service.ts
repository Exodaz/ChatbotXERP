import { and, type DatabaseClient, db, eq } from "@chatbotx.io/database/client"
import {
  productCategoryModel,
  productModel,
  productVariantModel,
} from "@chatbotx.io/database/schema"
import { createId } from "@chatbotx.io/utils"
import { BaseService } from "../base.service"
import { type StockroomStockItem, stockroomClient } from "./stockroom-client"

export interface StockSyncResult {
  error?: string
  notFoundSkus: string[]
  success: boolean
  totalFetched: number
  updatedVariants: number
}

export interface CatalogImportResult {
  error?: string
  productsImported: number
  success: boolean
  variantsImported: number
}

export class StockSyncService extends BaseService {
  /**
   * Syncs real-time stock numbers from Stockroom into ChatbotX ERP
   */
  async syncStock(
    input: {
      workspaceId: string
      apiKey: string
      updatedSince?: string
      category?: string
      overbookingAllowance?: number
    },
    tx: DatabaseClient = db,
  ): Promise<StockSyncResult> {
    const {
      workspaceId,
      apiKey,
      updatedSince,
      category,
      overbookingAllowance = 0,
    } = input

    try {
      const stockItems = await stockroomClient.fetchAllStock({
        apiKey,
        updated_since: updatedSince,
        category,
      })

      let updatedVariants = 0
      const notFoundSkus: string[] = []

      for (const item of stockItems) {
        if (!item.sku) {
          continue
        }

        // 1. Find variant by SKU
        const [existing] = await tx
          .select({
            variant: productVariantModel,
            product: productModel,
          })
          .from(productVariantModel)
          .innerJoin(
            productModel,
            eq(productVariantModel.productId, productModel.id),
          )
          .where(
            and(
              eq(productModel.workspaceId, workspaceId),
              eq(productVariantModel.sku, item.sku),
            ),
          )

        if (!existing) {
          notFoundSkus.push(item.sku)
          continue
        }

        // 2. Compute stock levels and overbooking cap
        // available = Ready stock
        // incoming = QC waiting stock
        // maxCapQuantity = ready + qc + allowance
        const readyStock = item.available ?? item.stock.ready ?? 0
        const qcStock = item.stock.qc ?? 0
        const maxCap = readyStock + qcStock + overbookingAllowance

        await tx
          .update(productVariantModel)
          .set({
            availableQuantity: readyStock,
            incomingQuantity: qcStock,
            maxCapQuantity: maxCap,
          })
          .where(eq(productVariantModel.id, existing.variant.id))

        updatedVariants++
      }

      return {
        success: true,
        totalFetched: stockItems.length,
        updatedVariants,
        notFoundSkus,
      }
    } catch (err: unknown) {
      return {
        success: false,
        totalFetched: 0,
        updatedVariants: 0,
        notFoundSkus: [],
        error: err instanceof Error ? err.message : "Stock sync failed",
      }
    }
  }

  /**
   * Imports product catalog and variants from Stockroom into workspace
   */
  async importCatalog(
    input: {
      workspaceId: string
      apiKey: string
      category?: string
    },
    tx: DatabaseClient = db,
  ): Promise<CatalogImportResult> {
    const { workspaceId, apiKey, category } = input

    try {
      const { data: products } = await stockroomClient.fetchProductsPage({
        apiKey,
        category,
        limit: 1000,
      })

      let productsImported = 0
      let variantsImported = 0

      // Also fetch current stock levels to seed variants with accurate available quantities
      const stockItems = await stockroomClient.fetchAllStock({
        apiKey,
        category,
      })
      const stockMap = new Map<string, StockroomStockItem>()
      for (const s of stockItems) {
        if (s.sku) {
          stockMap.set(s.sku, s)
        }
      }

      for (const prod of products) {
        // 1. Resolve or create category
        let categoryId: string | null = null
        if (prod.category) {
          const [foundCat] = await tx
            .select()
            .from(productCategoryModel)
            .where(
              and(
                eq(productCategoryModel.workspaceId, workspaceId),
                eq(productCategoryModel.name, prod.category),
              ),
            )

          if (foundCat) {
            categoryId = foundCat.id
          } else {
            const [newCat] = await tx
              .insert(productCategoryModel)
              .values({
                id: createId(),
                workspaceId,
                name: prod.category,
              })
              .returning()
            categoryId = newCat.id
          }
        }

        // 2. Check if product exists in this workspace
        let [existingProduct] = await tx
          .select()
          .from(productModel)
          .where(
            and(
              eq(productModel.workspaceId, workspaceId),
              eq(productModel.name, prod.name),
            ),
          )

        if (!existingProduct) {
          const [created] = await tx
            .insert(productModel)
            .values({
              id: createId(),
              workspaceId,
              name: prod.name,
              shortDescription:
                prod.description || `${prod.brand || ""} ${prod.name}`.trim(),
              categoryId,
              isActive: true,
              isSearchable: true,
            })
            .returning()
          existingProduct = created
          productsImported++
        }

        // 3. Upsert variants
        for (const v of prod.variants) {
          if (!v.sku) {
            continue
          }

          const [existingVariant] = await tx
            .select()
            .from(productVariantModel)
            .where(
              and(
                eq(productVariantModel.productId, existingProduct.id),
                eq(productVariantModel.sku, v.sku),
              ),
            )

          const stockInfo = stockMap.get(v.sku)
          const availableQuantity = stockInfo?.available ?? 0
          const incomingQuantity = stockInfo?.stock.qc ?? 0
          const maxCap = availableQuantity + incomingQuantity

          if (existingVariant) {
            await tx
              .update(productVariantModel)
              .set({
                availableQuantity,
                incomingQuantity,
                maxCapQuantity: maxCap,
              })
              .where(eq(productVariantModel.id, existingVariant.id))
          } else {
            await tx.insert(productVariantModel).values({
              id: createId(),
              productId: existingProduct.id,
              combination: {
                color: v.color || "Default",
                size: v.size || "Free Size",
              },
              sku: v.sku,
              price: v.price || 0,
              availableQuantity,
              incomingQuantity,
              maxCapQuantity: maxCap,
              reservedQuantity: 0,
              isEnabled: true,
            })
            variantsImported++
          }
        }
      }

      return {
        success: true,
        productsImported,
        variantsImported,
      }
    } catch (err: unknown) {
      return {
        success: false,
        productsImported: 0,
        variantsImported: 0,
        error: err instanceof Error ? err.message : "Catalog import failed",
      }
    }
  }
}

export const stockSyncService = new StockSyncService()
