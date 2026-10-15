import z from "zod"

export const orderStatusTypes = z.enum([
  "reserved", // จองสต็อกอยู่ รอชำระเงิน
  "pending_payment", // รอตรวจสอบสลิป หรือรอชำระ
  "paid", // ชำระเงินเรียบร้อยแล้ว
  "packing", // กำลังจัดเตรียมพัสดุ
  "shipped", // จัดส่งแล้ว
  "completed", // เสร็จสมบูรณ์
  "expired", // หมดเวลาจอง คืนสต็อกแล้ว
  "cancelled", // ยกเลิก
])
export type OrderStatusType = z.infer<typeof orderStatusTypes>

export const paymentMethodTypes = z.enum([
  "bank_transfer", // โอนบัญชีธนาคาร + สลิป
  "moneyspace_credit_card", // บัตรเครดิตผ่าน Moneyspace
  "qr_code", // QR Code (แอดมินอนุมัติ)
  "cod", // เก็บเงินปลายทาง
])
export type PaymentMethodType = z.infer<typeof paymentMethodTypes>

export const paymentStatusTypes = z.enum([
  "pending", // รอชำระ
  "awaiting_approval", // รอแอดมินอนุมัติ (เช่น QR Code หรือ สลิปที่ไม่ผ่าน auto-check)
  "verified", // ยืนยันการชำระแล้ว
  "failed", // ล้มเหลว
  "refunded", // คืนเงิน
])
export type PaymentStatusType = z.infer<typeof paymentStatusTypes>

export const shippingCarrierTypes = z.enum([
  "flash_express",
  "jt_express",
  "kerry_express",
  "thailand_post",
  "spx_express",
  "other",
])
export type ShippingCarrierType = z.infer<typeof shippingCarrierTypes>

export const orderShippingAddressSchema = z.object({
  recipientName: z.string(),
  phoneNumber: z.string(),
  addressLine1: z.string(),
  subdistrict: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string(),
  note: z.string().optional(),
})
export type OrderShippingAddress = z.infer<typeof orderShippingAddressSchema>
