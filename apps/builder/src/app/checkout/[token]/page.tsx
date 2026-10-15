import { orderService } from "@chatbotx.io/business"
import { notFound } from "next/navigation"
import { CheckoutClientView } from "./client-view"

export const dynamic = "force-dynamic"

function getOrderStatusLabel(status: string): string {
  if (status === "reserved") {
    return "รอชำระเงิน"
  }
  if (status === "paid") {
    return "ชำระเงินแล้ว"
  }
  if (status === "pending_payment") {
    return "รอตรวจสอบสลิป"
  }
  return status
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await orderService.findByToken(token)

  if (!data) {
    notFound()
  }

  const { order, items } = data

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-xl">สรุปคำสั่งซื้อ (Order Summary)</h1>
              <p className="text-blue-100 text-sm">
                หมายเลขออเดอร์: {order.orderNumber}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 font-semibold text-xs backdrop-blur-sm">
                {getOrderStatusLabel(order.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Client Interactive Component */}
        <CheckoutClientView items={items} order={order} token={token} />
      </div>
    </div>
  )
}
