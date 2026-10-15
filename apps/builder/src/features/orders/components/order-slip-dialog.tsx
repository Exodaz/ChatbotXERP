"use client"

import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@chatbotx.io/ui/components/ui/dialog"
import {
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  XCircle,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { approvePaymentAction } from "../actions/approve-payment.action"

interface OrderSlipDialogProps {
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  open: boolean
  order: {
    id: string
    orderNumber: string
    totalAmount: number
    slipUrl: string | null
    slipVerifiedData: Record<string, unknown> | null
    paymentStatus: string
  } | null
  workspaceId: string
}

export function OrderSlipDialog({
  workspaceId,
  order,
  open,
  onOpenChange,
  onSuccess,
}: OrderSlipDialogProps) {
  const [isApproving, setIsApproving] = useState(false)

  if (!order) {
    return null
  }

  const handleApprove = async () => {
    try {
      setIsApproving(true)
      const res = await approvePaymentAction(workspaceId, { orderId: order.id })
      if (res?.data) {
        toast.success("อนุมัติการชำระเงินเรียบร้อยแล้ว")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error("ไม่สามารถอนุมัติได้ กรุณาลองใหม่อีกครั้ง")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอนุมัติ")
    } finally {
      setIsApproving(false)
    }
  }

  const verified = order.slipVerifiedData
  const isValid = verified?.isValid === true

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>ตรวจสอบสลิปโอนเงิน - {order.orderNumber}</DialogTitle>
          <DialogDescription>
            ยอดรวมที่ต้องชำระ: ฿{order.totalAmount.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {order.slipUrl ? (
            <div className="relative flex max-h-[350px] justify-center overflow-hidden rounded-lg border bg-muted/40 p-2">
              {/* biome-ignore lint/performance/noImgElement: customer slip image */}
              <img
                alt="Bank Transfer Slip"
                className="max-h-[330px] w-auto rounded object-contain"
                height={330}
                src={order.slipUrl}
                width={250}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/20 p-8 text-muted-foreground">
              <ImageIcon className="mb-2 h-10 w-10 opacity-50" />
              <p>ยังไม่มีการแนบสลิป</p>
            </div>
          )}

          {/* Auto-check metadata from Easyslip */}
          {verified && (
            <div className="space-y-1.5 rounded-md border bg-muted/30 p-3 text-xs">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-sm">
                {isValid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-emerald-700 dark:text-emerald-400">
                      ระบบตรวจสอบอัตโนมัติ: สลิปถูกต้อง
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-rose-500" />
                    <span className="text-rose-700 dark:text-rose-400">
                      ระบบตรวจสอบอัตโนมัติ: ต้องตรวจสอบด้วยตนเอง
                    </span>
                  </>
                )}
              </div>

              {typeof verified.transRef === "string" && (
                <div>
                  รหัสอ้างอิง:{" "}
                  <span className="font-mono">{verified.transRef}</span>
                </div>
              )}
              {typeof verified.amount === "number" && (
                <div>
                  ยอดเงินในสลิป:{" "}
                  <span className="font-semibold text-emerald-600">
                    ฿{verified.amount.toLocaleString()}
                  </span>
                </div>
              )}
              {typeof verified.senderName === "string" && (
                <div>ผู้โอน: {verified.senderName}</div>
              )}
              {typeof verified.receiverName === "string" && (
                <div>ผู้รับ: {verified.receiverName}</div>
              )}
              {typeof verified.transDate === "string" && (
                <div>
                  เวลาโอน: {verified.transDate}{" "}
                  {typeof verified.transTime === "string"
                    ? verified.transTime
                    : ""}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex items-center gap-2 sm:justify-between">
          {order.slipUrl && (
            <Button
              onClick={() => {
                if (order.slipUrl) {
                  window.open(order.slipUrl, "_blank")
                }
              }}
              size="sm"
              variant="outline"
            >
              <ExternalLink className="mr-1 h-4 w-4" />
              เปิดภาพเต็ม
            </Button>
          )}

          <div className="ml-auto flex gap-2">
            <Button onClick={() => onOpenChange(false)} variant="ghost">
              ปิด
            </Button>
            {order.paymentStatus !== "verified" && (
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={isApproving}
                onClick={handleApprove}
                variant="default"
              >
                {isApproving ? "กำลังอนุมัติ..." : "อนุมัติการชำระเงิน"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
