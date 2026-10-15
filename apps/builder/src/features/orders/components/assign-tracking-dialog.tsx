"use client"

import { CARRIERS, type CarrierMetadata } from "@chatbotx.io/business/shipping"
import type { ShippingCarrierType } from "@chatbotx.io/database/partials"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@chatbotx.io/ui/components/ui/dialog"
import { Input } from "@chatbotx.io/ui/components/ui/input"
import { Label } from "@chatbotx.io/ui/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@chatbotx.io/ui/components/ui/select"
import { Truck, Wand2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { assignTrackingAction } from "../actions/assign-tracking.action"
import { autoBookCarrierAction } from "../actions/auto-book-carrier.action"

interface AssignTrackingDialogProps {
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  open: boolean
  order: {
    id: string
    orderNumber: string
    shippingCarrier: string | null
    trackingNumber: string | null
    shippingAddress: Record<string, unknown> | null
  } | null
  workspaceId: string
}

export function AssignTrackingDialog({
  workspaceId,
  order,
  open,
  onOpenChange,
  onSuccess,
}: AssignTrackingDialogProps) {
  const [carrier, setCarrier] = useState<ShippingCarrierType>(
    (order?.shippingCarrier as ShippingCarrierType) || "flash_express",
  )
  const [trackingNumber, setTrackingNumber] = useState(
    order?.trackingNumber || "",
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoBooking, setIsAutoBooking] = useState(false)

  if (!order) {
    return null
  }

  const handleManualSave = async () => {
    if (!trackingNumber.trim()) {
      toast.error("กรุณาระบุเลขพัสดุ")
      return
    }

    try {
      setIsLoading(true)
      const res = await assignTrackingAction(workspaceId, {
        orderId: order.id,
        carrier,
        trackingNumber: trackingNumber.trim(),
      })
      if (res?.data) {
        toast.success("บันทึกเลขพัสดุและเปลี่ยนสถานะเป็น 'จัดส่งแล้ว' เรียบร้อย")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error("ไม่สามารถบันทึกได้")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutoBook = async () => {
    if (!order.shippingAddress) {
      toast.error("ออเดอร์นี้ยังไม่มีที่อยู่จัดส่ง ไม่สามารถจองขนส่งได้")
      return
    }

    try {
      setIsAutoBooking(true)
      const res = await autoBookCarrierAction(workspaceId, {
        orderId: order.id,
        carrier,
      })
      if (res?.data) {
        toast.success(`ออกเลขพัสดุสำเร็จ: ${res.data.trackingNumber}`)
        setTrackingNumber(res.data.trackingNumber || "")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error("ไม่สามารถออกเลขพัสดุอัตโนมัติได้")
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการออกเลขพัสดุ",
      )
    } finally {
      setIsAutoBooking(false)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            จัดส่งพัสดุ - {order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            เลือกผู้ให้บริการขนส่งและระบุเลขพัสดุ หรือสร้างเลขพัสดุอัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>ผู้ให้บริการขนส่ง (Carrier)</Label>
            <Select
              onValueChange={(val) => setCarrier(val as ShippingCarrierType)}
              value={carrier}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกขนส่ง" />
              </SelectTrigger>
              <SelectContent>
                {(Object.values(CARRIERS) as CarrierMetadata[]).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>เลขพัสดุ (Tracking Number)</Label>
              <Button
                className="h-7 text-primary text-xs"
                disabled={isAutoBooking || isLoading}
                onClick={handleAutoBook}
                size="sm"
                type="button"
                variant="ghost"
              >
                <Wand2 className="mr-1 h-3.5 w-3.5" />
                {isAutoBooking ? "กำลังออกเลข..." : "ออกเลขอัตโนมัติ"}
              </Button>
            </div>
            <Input
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="เช่น TH0123456789"
              value={trackingNumber}
            />
          </div>

          {!order.shippingAddress && (
            <p className="rounded border border-amber-200 bg-amber-50 p-2 text-amber-600 text-xs dark:bg-amber-950/50">
              ⚠️ ลูกค้ายังไม่ได้กรอกที่อยู่จัดส่งในหน้าชำระเงิน
            </p>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-end">
          <Button onClick={() => onOpenChange(false)} variant="ghost">
            ยกเลิก
          </Button>
          <Button
            className="bg-primary"
            disabled={isLoading || isAutoBooking}
            onClick={handleManualSave}
          >
            {isLoading ? "กำลังบันทึก..." : "บันทึกและจัดส่ง"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
