import { orderService } from "@chatbotx.io/business/order"
import { getChildLogger } from "@chatbotx.io/logger"

const log = getChildLogger("purge-expired-order-reservations")

/**
 * Periodically scans for reserved orders that have passed their `expiresAt`
 * timestamp (e.g. 24h past live CF reservation), marks them expired,
 * and atomically releases their reserved stock back to available inventory.
 */
export async function purgeExpiredOrderReservations(): Promise<void> {
  try {
    const expiredCount = await orderService.processExpiredOrders()
    if (expiredCount > 0) {
      log.info(
        { expiredCount },
        "purgeExpiredOrderReservations: expired orders processed and stock released",
      )
    }
  } catch (err) {
    log.error(
      { err },
      "purgeExpiredOrderReservations: failed to process expired orders",
    )
  }
}
