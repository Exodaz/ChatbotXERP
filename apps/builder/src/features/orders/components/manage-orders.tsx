"use client"

import { CARRIERS, getTrackingUrl } from "@chatbotx.io/business"
import type {
  OrderStatusType,
  ShippingCarrierType,
} from "@chatbotx.io/database/partials"
import type { OrderItemModel, OrderModel } from "@chatbotx.io/database/types"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import { Checkbox } from "@chatbotx.io/ui/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@chatbotx.io/ui/components/ui/dropdown-menu"
import { Input } from "@chatbotx.io/ui/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@chatbotx.io/ui/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@chatbotx.io/ui/components/ui/tabs"
import {
  ChevronDown,
  ExternalLink,
  Eye,
  Package,
  Printer,
  Search,
  Truck,
  Video,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { updateOrderStatusAction } from "../actions/update-order-status.action"
import { AssignTrackingDialog } from "./assign-tracking-dialog"
import { OrderSlipDialog } from "./order-slip-dialog"
import { OrderStatusBadge, PaymentStatusBadge } from "./order-status-badge"

export type OrderWithDetails = OrderModel & {
  items: OrderItemModel[]
  contact?: {
    fullName: string | null
    avatar: string | null
    phoneNumber: string | null
  } | null
}

interface ManageOrdersProps {
  initialOrders: OrderWithDetails[]
  total: number
  workspaceId: string
}

export function ManageOrders({
  workspaceId,
  initialOrders,
  total: _total,
}: ManageOrdersProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderWithDetails[]>(initialOrders)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [slipOrder, setSlipOrder] = useState<OrderWithDetails | null>(null)
  const [trackingOrder, setTrackingOrder] = useState<OrderWithDetails | null>(
    null,
  )

  // Filter orders based on active tab and search query
  const filteredOrders = orders.filter((order) => {
    // 1. Tab filter
    if (activeTab === "reserved" && order.status !== "reserved") {
      return false
    }
    if (activeTab === "pending_payment" && order.status !== "pending_payment") {
      return false
    }
    if (activeTab === "paid" && order.status !== "paid") {
      return false
    }
    if (activeTab === "packing" && order.status !== "packing") {
      return false
    }
    if (activeTab === "shipped" && order.status !== "shipped") {
      return false
    }
    if (activeTab === "completed" && order.status !== "completed") {
      return false
    }
    if (
      activeTab === "cancelled" &&
      order.status !== "cancelled" &&
      order.status !== "expired"
    ) {
      return false
    }

    // 2. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const recipient =
        order.shippingAddress?.recipientName?.toLowerCase() || ""
      const phone =
        order.shippingAddress?.phoneNumber || order.contact?.phoneNumber || ""
      const orderNum = order.orderNumber.toLowerCase()
      const tracking = order.trackingNumber?.toLowerCase() || ""
      const contactName = order.contact?.fullName?.toLowerCase() || ""

      return (
        orderNum.includes(q) ||
        recipient.includes(q) ||
        contactName.includes(q) ||
        phone.includes(q) ||
        tracking.includes(q)
      )
    }

    return true
  })

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredOrders.map((o) => o.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  // Status transition handler
  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatusType,
  ) => {
    try {
      const res = await updateOrderStatusAction(workspaceId, {
        orderId,
        status: newStatus,
      })
      if (res?.data) {
        toast.success("อัปเดตสถานะคำสั่งซื้อเรียบร้อย")
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        )
      } else {
        toast.error("ไม่สามารถอัปเดตสถานะได้")
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัปเดตสถานะ",
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Header & Filter Controls */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-bold text-xl tracking-tight">
            จัดการออเดอร์และการจัดส่ง (Orders & Shipping)
          </h2>
          <p className="mt-0.5 text-muted-foreground text-xs">
            คำสั่งซื้อจาก Facebook Live CF, ชำระเงิน, ออกเลขพัสดุ และพิมพ์ใบปะหน้าพัสดุ
          </p>
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Link
              href={`/space/${workspaceId}/orders/print?ids=${selectedIds.join(",")}`}
              target="_blank"
            >
              <Button className="bg-primary shadow" size="sm">
                <Printer className="mr-1.5 h-4 w-4" />
                พิมพ์ใบปะหน้าพัสดุ ({selectedIds.length})
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Status Filter Tabs */}
      <div className="flex flex-col justify-between gap-3 border-b pb-2 sm:flex-row sm:items-center">
        <Tabs
          className="w-full sm:w-auto"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <TabsList className="grid h-9 grid-cols-4 bg-muted/60 p-1 sm:flex">
            <TabsTrigger className="text-xs" value="all">
              ทั้งหมด ({orders.length})
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="reserved">
              จองสต็อก
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="pending_payment">
              รอตรวจสลิป
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="paid">
              ชำระแล้ว
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="packing">
              กำลังแพ็ค
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="shipped">
              จัดส่งแล้ว
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="completed">
              สำเร็จ
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="cancelled">
              ยกเลิก/หมดอายุ
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="h-9 pl-8 text-xs"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาเลขบิล, ชื่อ, เบอร์, เลขพัสดุ..."
            value={searchQuery}
          />
        </div>
      </div>

      {/* 3. Orders Table */}
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    filteredOrders.length > 0 &&
                    selectedIds.length === filteredOrders.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="text-xs">คำสั่งซื้อ (Order)</TableHead>
              <TableHead className="text-xs">ลูกค้า (Customer)</TableHead>
              <TableHead className="text-xs">สินค้า (Items)</TableHead>
              <TableHead className="text-right text-xs">
                ยอดรวม (Total)
              </TableHead>
              <TableHead className="text-xs">การชำระเงิน (Payment)</TableHead>
              <TableHead className="text-xs">สถานะ (Status)</TableHead>
              <TableHead className="text-xs">
                ขนส่ง / เลขพัสดุ (Tracking)
              </TableHead>
              <TableHead className="text-right text-xs">
                จัดการ (Actions)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  className="h-32 text-center text-muted-foreground text-sm"
                  colSpan={9}
                >
                  <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  ไม่พบคำสั่งซื้อในหมวดนี้
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedIds.includes(order.id)
                const recipient = order.shippingAddress
                const trackingUrl =
                  order.shippingCarrier && order.trackingNumber
                    ? getTrackingUrl(
                        order.shippingCarrier,
                        order.trackingNumber,
                      )
                    : null

                return (
                  <TableRow
                    className={isSelected ? "bg-muted/40" : ""}
                    key={order.id}
                  >
                    {/* Checkbox */}
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectOne(order.id, !!checked)
                        }
                      />
                    </TableCell>

                    {/* Order Number & Meta */}
                    <TableCell>
                      <div className="font-mono font-semibold text-primary text-xs">
                        {order.orderNumber}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                      {order.liveSessionId && (
                        <div className="mt-0.5 inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 font-medium text-[10px] text-rose-600 dark:bg-rose-950">
                          <Video className="h-3 w-3" />
                          Live CF
                        </div>
                      )}
                    </TableCell>

                    {/* Customer */}
                    <TableCell>
                      <div className="font-medium text-xs">
                        {recipient?.recipientName ||
                          order.contact?.fullName ||
                          "ลูกค้า"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {recipient?.phoneNumber ||
                          order.contact?.phoneNumber ||
                          "-"}
                      </div>
                      {recipient?.province && (
                        <div className="line-clamp-1 text-[10px] text-muted-foreground">
                          {recipient.subdistrict} {recipient.district}{" "}
                          {recipient.province} {recipient.postalCode}
                        </div>
                      )}
                    </TableCell>

                    {/* Items */}
                    <TableCell>
                      <div className="font-medium text-xs">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} ชิ้น
                      </div>
                      <div className="line-clamp-1 max-w-[180px] text-[11px] text-muted-foreground">
                        {order.items
                          .map((i) => `${i.productName} (${i.quantity})`)
                          .join(", ")}
                      </div>
                    </TableCell>

                    {/* Total Amount */}
                    <TableCell className="text-right">
                      <span className="font-bold text-xs">
                        ฿{order.totalAmount.toLocaleString()}
                      </span>
                    </TableCell>

                    {/* Payment */}
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <PaymentStatusBadge status={order.paymentStatus} />
                        {order.slipUrl && (
                          <Button
                            className="h-6 px-1 text-[10px] text-primary hover:underline"
                            onClick={() => setSlipOrder(order)}
                            size="sm"
                            variant="ghost"
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            ดูสลิปโอน
                          </Button>
                        )}
                      </div>
                    </TableCell>

                    {/* Order Status */}
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>

                    {/* Tracking */}
                    <TableCell>
                      {order.trackingNumber ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-[11px] text-muted-foreground">
                            {CARRIERS[
                              order.shippingCarrier as ShippingCarrierType
                            ]?.name || order.shippingCarrier}
                          </div>
                          <div className="flex items-center gap-1 font-bold font-mono text-emerald-600 text-xs">
                            {order.trackingNumber}
                            {trackingUrl && (
                              <a
                                className="text-muted-foreground hover:text-primary"
                                href={trackingUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Button
                          className="h-7 text-[11px]"
                          onClick={() => setTrackingOrder(order)}
                          size="sm"
                          variant="outline"
                        >
                          <Truck className="mr-1 h-3.5 w-3.5" />
                          ระบุขนส่ง
                        </Button>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Single Print */}
                        <Link
                          href={`/space/${workspaceId}/orders/print?ids=${order.id}`}
                          target="_blank"
                        >
                          <Button
                            className="h-8 w-8"
                            size="icon"
                            title="พิมพ์ใบปะหน้า"
                            variant="ghost"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* Status Change Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                className="h-8 w-8"
                                size="icon"
                                variant="ghost"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(order.id, "paid")
                              }
                            >
                              เปลี่ยนเป็น: ชำระแล้ว (Paid)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(order.id, "packing")
                              }
                            >
                              เปลี่ยนเป็น: กำลังแพ็ค (Packing)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setTrackingOrder(order)}
                            >
                              ออกเลขพัสดุ / จัดส่ง (Shipped)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(order.id, "completed")
                              }
                            >
                              เปลี่ยนเป็น: เสร็จสมบูรณ์ (Completed)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-rose-600"
                              onClick={() =>
                                handleStatusChange(order.id, "cancelled")
                              }
                            >
                              ยกเลิกคำสั่งซื้อ (Cancel)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Slip Viewer & Approval Dialog */}
      <OrderSlipDialog
        onOpenChange={(open) => !open && setSlipOrder(null)}
        onSuccess={() => {
          if (slipOrder) {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === slipOrder.id
                  ? { ...o, paymentStatus: "verified", status: "paid" }
                  : o,
              ),
            )
          }
        }}
        open={!!slipOrder}
        order={slipOrder}
        workspaceId={workspaceId}
      />

      {/* Assign Tracking & Carrier Dialog */}
      <AssignTrackingDialog
        onOpenChange={(open) => !open && setTrackingOrder(null)}
        onSuccess={() => {
          router.refresh()
        }}
        open={!!trackingOrder}
        order={trackingOrder}
        workspaceId={workspaceId}
      />
    </div>
  )
}
