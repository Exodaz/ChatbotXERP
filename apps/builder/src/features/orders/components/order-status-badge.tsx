import type {
  OrderStatusType,
  PaymentStatusType,
} from "@chatbotx.io/database/partials"
import { Badge } from "@chatbotx.io/ui/components/ui/badge"
import { cn } from "@chatbotx.io/ui/lib/utils"

interface OrderStatusBadgeProps {
  className?: string
  status: OrderStatusType
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  let label = ""
  let colorClass = ""

  switch (status) {
    case "reserved":
      label = "จองสินค้า"
      colorClass =
        "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
      break
    case "pending_payment":
      label = "รอชำระ / รอตรวจสลิป"
      colorClass =
        "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300"
      break
    case "paid":
      label = "ชำระเงินแล้ว"
      colorClass =
        "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
      break
    case "packing":
      label = "กำลังจัดเตรียมพัสดุ"
      colorClass =
        "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300"
      break
    case "shipped":
      label = "จัดส่งแล้ว"
      colorClass =
        "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
      break
    case "completed":
      label = "เสร็จสมบูรณ์"
      colorClass =
        "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300"
      break
    case "expired":
      label = "หมดเวลาจอง"
      colorClass =
        "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400"
      break
    case "cancelled":
      label = "ยกเลิก"
      colorClass =
        "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
      break
    default:
      label = status
      colorClass = "bg-gray-100 text-gray-800"
  }

  return (
    <Badge
      className={cn("font-medium", colorClass, className)}
      variant="outline"
    >
      {label}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatusType }) {
  switch (status) {
    case "verified":
      return (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
          ตรวจสอบแล้ว
        </Badge>
      )
    case "awaiting_approval":
      return (
        <Badge className="bg-amber-500 text-white hover:bg-amber-600">
          รอแอดมินอนุมัติ
        </Badge>
      )
    case "failed":
      return <Badge variant="destructive">ล้มเหลว</Badge>
    case "refunded":
      return <Badge variant="outline">คืนเงินแล้ว</Badge>
    default:
      return <Badge variant="secondary">รอชำระ</Badge>
  }
}
