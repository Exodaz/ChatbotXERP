"use client"

import type { LiveSalesSummary } from "@chatbotx.io/business"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@chatbotx.io/ui/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@chatbotx.io/ui/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@chatbotx.io/ui/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@chatbotx.io/ui/components/ui/table"
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Flame,
  Package,
  ShoppingBag,
  TrendingUp,
  Video,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { sendOrderReminderAction } from "../actions/send-order-reminder.action"
import { OrderStatusBadge } from "./order-status-badge"

interface LiveSalesDashboardProps {
  currentSessionId?: string | null
  initialData: LiveSalesSummary
  workspaceId: string
}

export function LiveSalesDashboard({
  workspaceId,
  initialData,
  currentSessionId,
}: LiveSalesDashboardProps) {
  const router = useRouter()
  const [selectedSession, setSelectedSession] = useState<string>(
    currentSessionId || "all",
  )
  const [reminderModal, setReminderModal] = useState<{
    open: boolean
    orderNumber: string
    message: string
  }>({
    open: false,
    orderNumber: "",
    message: "",
  })
  const [isSendingReminder, setIsSendingReminder] = useState(false)

  const handleSessionChange = (sessionId: string) => {
    setSelectedSession(sessionId)
    router.push(
      `/space/${workspaceId}/live-sales${
        sessionId && sessionId !== "all" ? `?sessionId=${sessionId}` : ""
      }`,
    )
  }

  const handleTriggerReminder = async (orderId: string) => {
    try {
      setIsSendingReminder(true)
      const res = await sendOrderReminderAction(workspaceId, { orderId })
      if (res?.data) {
        setReminderModal({
          open: true,
          orderNumber: res.data.orderNumber,
          message: res.data.message,
        })
      } else {
        toast.error("ไม่สามารถสร้างข้อความแจ้งเตือนได้")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    } finally {
      setIsSendingReminder(false)
    }
  }

  const handleCopyReminder = () => {
    navigator.clipboard.writeText(reminderModal.message)
    toast.success("คัดลอกข้อความแจ้งเตือนเรียบร้อยแล้ว")
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Session Filter */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-xl tracking-tight">
              แดชบอร์ดยอดขาย Facebook Live (Live Sales & Analytics)
            </h2>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
          </div>
          <p className="mt-0.5 text-muted-foreground text-xs">
            สรุปยอดขายแบบเรียลไทม์, อัตราการชำระเงิน (Conversion), สินค้าขายดี
            และเครื่องมือทวงบิลอัตโนมัติ
          </p>
        </div>

        {/* Live Session Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted-foreground" />
          <Select
            onValueChange={(val) =>
              handleSessionChange(typeof val === "string" ? val : "all")
            }
            value={selectedSession}
          >
            <SelectTrigger className="h-9 w-[220px] text-xs">
              <SelectValue placeholder="เลือกรอบการไลฟ์" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">รอบการไลฟ์ทั้งหมด (All)</SelectItem>
              {initialData.availableLiveSessions.map((sessionId) => (
                <SelectItem key={sessionId} value={sessionId}>
                  {sessionId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {/* Realized Revenue */}
        <Card className="border-l-4 border-l-emerald-500 bg-card">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="flex items-center justify-between font-medium text-[11px] text-muted-foreground">
              ยอดชำระแล้ว (Paid)
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-bold text-emerald-600 text-lg">
              ฿{initialData.totalRevenue.toLocaleString()}
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {initialData.paidOrdersCount} ออเดอร์
            </p>
          </CardContent>
        </Card>

        {/* Pipeline Potential Revenue */}
        <Card className="border-l-4 border-l-blue-500 bg-card">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="flex items-center justify-between font-medium text-[11px] text-muted-foreground">
              ยอด CF รวม (Total CF)
              <ShoppingBag className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-bold text-blue-600 text-lg">
              ฿{initialData.potentialRevenue.toLocaleString()}
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {initialData.totalOrders} คำสั่งซื้อทั้งหมด
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="border-l-4 border-l-purple-500 bg-card">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="flex items-center justify-between font-medium text-[11px] text-muted-foreground">
              ปิดการขาย (Conversion)
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-bold text-lg text-purple-600">
              {initialData.conversionRate}%
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              เฉลี่ย ฿{initialData.averageOrderValue.toLocaleString()}/บิล
            </p>
          </CardContent>
        </Card>

        {/* Reserved / Awaiting Checkout */}
        <Card className="border-l-4 border-l-amber-500 bg-card">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="flex items-center justify-between font-medium text-[11px] text-muted-foreground">
              ค้างชำระ (Reserved)
              <Clock className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-bold text-amber-600 text-lg">
              {initialData.reservedOrdersCount}
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              กำลังรอชำระเงิน
            </p>
          </CardContent>
        </Card>

        {/* Pending Slip Verification */}
        <Card className="border-l-4 border-l-orange-500 bg-card">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="flex items-center justify-between font-medium text-[11px] text-muted-foreground">
              รอตรวจสลิป (Verify)
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-bold text-lg text-orange-600">
              {initialData.pendingSlipCount}
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              รอแอดมินอนุมัติ
            </p>
          </CardContent>
        </Card>

        {/* Expired / Restocked */}
        <Card className="border-l-4 border-l-gray-400 bg-card">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="flex items-center justify-between font-medium text-[11px] text-muted-foreground">
              หลุดจอง (Expired)
              <Package className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-bold text-lg text-muted-foreground">
              {initialData.expiredOrdersCount}
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              คืนสต็อกอัตโนมัติ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Middle Section: Top Selling Items & Payment Methods */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top 8 Best Selling Products */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-semibold text-sm">
              <Flame className="h-4 w-4 text-rose-500" />
              อันดับสินค้าขายดีประจำรอบไลฟ์ (Top Best-Sellers)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {initialData.topProducts.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-xs">
                ยังไม่มีข้อมูลการขายสินค้าในรอบไลฟ์นี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="w-12">อันดับ</TableHead>
                      <TableHead>สินค้า / SKU</TableHead>
                      <TableHead>รหัส CF (Live Code)</TableHead>
                      <TableHead className="text-right">จำนวน CF</TableHead>
                      <TableHead className="text-right">มูลค่ารวม</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialData.topProducts.map((item, idx) => (
                      <TableRow key={item.sku || `${item.productName}-${idx}`}>
                        <TableCell className="font-bold text-muted-foreground text-xs">
                          #{idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-xs">
                            {item.productName}
                          </div>
                          {item.sku && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              SKU: {item.sku}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.liveCode ? (
                            <span className="inline-block rounded bg-primary/10 px-2 py-0.5 font-bold font-mono text-primary text-xs">
                              {item.liveCode}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs">
                          {item.quantity} ชิ้น
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 text-xs">
                          ฿{item.totalRevenue.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-semibold text-sm">
              <CreditCard className="h-4 w-4 text-primary" />
              สัดส่วนช่องทางชำระเงิน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {initialData.paymentBreakdown.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-xs">
                ยังไม่มีข้อมูลการชำระเงิน
              </div>
            ) : (
              initialData.paymentBreakdown.map((stat) => {
                const total = initialData.totalOrders || 1
                const percent = Math.round((stat.count / total) * 100)

                return (
                  <div className="space-y-1" key={stat.method}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{stat.label}</span>
                      <span className="font-bold">
                        {stat.count} บิล ({percent}%)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-right text-[10px] text-muted-foreground">
                      ยอดชำระจริง: ฿{stat.totalAmount.toLocaleString()}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Real-time Live CF Stream & Quick Reminders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 font-semibold text-sm">
            <Clock className="h-4 w-4 text-primary" />
            รายการ CF ล่าสุดในรอบไลฟ์ (Live Stream Activity)
          </CardTitle>
          <Link href={`/space/${workspaceId}/orders`}>
            <Button className="text-primary text-xs" size="sm" variant="ghost">
              ดูออเดอร์ทั้งหมด →
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>คำสั่งซื้อ</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead className="text-right">ยอดเงิน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>เวลา CF</TableHead>
                  <TableHead className="text-right">แจ้งเตือน / ทวงบิล</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialData.recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="py-8 text-center text-muted-foreground text-xs"
                      colSpan={6}
                    >
                      ยังไม่มีคำสั่งซื้อในรอบไลฟ์นี้
                    </TableCell>
                  </TableRow>
                ) : (
                  initialData.recentOrders.map((order) => {
                    const isUnpaid = order.status === "reserved"

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-semibold text-primary text-xs">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell className="font-medium text-xs">
                          {order.contactName || "ลูกค้า"}
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs">
                          ฿{order.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {new Date(order.createdAt).toLocaleTimeString(
                            "th-TH",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isUnpaid ? (
                            <Button
                              className="h-7 border-amber-300 text-[11px] text-amber-700 hover:bg-amber-50 dark:text-amber-400"
                              disabled={isSendingReminder}
                              onClick={() => handleTriggerReminder(order.id)}
                              size="sm"
                              variant="outline"
                            >
                              <BellRing className="mr-1 h-3 w-3" />
                              ทวงบิลก่อนหลุดจอง
                            </Button>
                          ) : (
                            <span className="flex items-center justify-end gap-1 font-medium text-[11px] text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              ชำระแล้ว
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Message Preview Modal */}
      <Dialog
        onOpenChange={(open) => setReminderModal((prev) => ({ ...prev, open }))}
        open={reminderModal.open}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-amber-500" />
              ข้อความแจ้งเตือนออเดอร์ #{reminderModal.orderNumber}
            </DialogTitle>
            <DialogDescription>
              ระบบสร้างข้อความทวงชำระเงินพร้อมลิงก์เว็บเช็กเอาต์และเวลาหมดอายุให้อัตโนมัติ
            </DialogDescription>
          </DialogHeader>

          <div className="whitespace-pre-wrap rounded-lg border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
            {reminderModal.message}
          </div>

          <DialogFooter className="flex justify-between gap-2 sm:justify-end">
            <Button
              onClick={() =>
                setReminderModal((prev) => ({ ...prev, open: false }))
              }
              variant="outline"
            >
              ปิด
            </Button>
            <Button className="bg-primary" onClick={handleCopyReminder}>
              <Copy className="mr-1.5 h-4 w-4" />
              คัดลอกข้อความ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
