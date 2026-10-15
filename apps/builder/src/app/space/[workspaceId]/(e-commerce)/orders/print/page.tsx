import { orderService } from "@chatbotx.io/business"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PrintButton } from "@/features/orders/components/print-button"
import { ShippingLabel } from "@/features/orders/components/shipping-label"
import { withWorkspaceIdSchema } from "@/features/workspaces/schema/resource"

export default async function PrintOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>
  searchParams: Promise<{ ids?: string }>
}) {
  const { data } = withWorkspaceIdSchema.safeParse(await params)
  if (!data) {
    return notFound()
  }

  const { ids } = await searchParams
  const orderIds = ids ? ids.split(",").filter(Boolean) : []

  const orders = await orderService.getOrdersForPrinting(
    orderIds,
    data.workspaceId,
  )

  return (
    <div className="min-h-screen bg-neutral-100 py-6 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
      {/* Print Control Toolbar (Hidden in print) */}
      <div className="no-print mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4 px-4 shadow-sm dark:bg-neutral-800">
        <div className="flex items-center gap-3">
          <Link href={`/space/${data.workspaceId}/orders`}>
            <Button size="sm" variant="outline">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              กลับไปหน้ารายการออเดอร์
            </Button>
          </Link>
          <span className="font-semibold text-sm">
            กำลังพิมพ์ {orders.length} ใบปะหน้าพัสดุ (100x150 mm)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Client Trigger for print */}
          <PrintButton />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p>ไม่พบออเดอร์ที่เลือกเพื่อพิมพ์ใบปะหน้า</p>
        </div>
      ) : (
        <div className="print-area space-y-6 print:space-y-0">
          {orders.map((order) => (
            <div className="print:page-break-after-always" key={order.id}>
              <ShippingLabel order={order} />
            </div>
          ))}
        </div>
      )}

      {/* Print CSS Rules */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print:page-break-after-always {
            page-break-after: always !important;
            break-after: page !important;
          }
          @page {
            size: 100mm 150mm;
            margin: 0mm;
          }
        }
      `}</style>
    </div>
  )
}
