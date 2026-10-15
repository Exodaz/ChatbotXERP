import { CARRIERS } from "@chatbotx.io/business/shipping"
import type { ShippingCarrierType } from "@chatbotx.io/database/partials"
import type { OrderItemModel, OrderModel } from "@chatbotx.io/database/types"
import { Barcode } from "./barcode"

interface ShippingLabelProps {
  order: OrderModel & {
    items: OrderItemModel[]
    contact?: {
      fullName: string | null
      phoneNumber: string | null
    } | null
  }
  shopInfo?: {
    name: string
    phoneNumber: string
    address: string
  }
}

export function ShippingLabel({ order, shopInfo }: ShippingLabelProps) {
  const carrierKey =
    (order.shippingCarrier as ShippingCarrierType) || "flash_express"
  const carrierName = CARRIERS[carrierKey]?.name || "FLASH EXPRESS"
  const trackingNumber = order.trackingNumber || order.orderNumber

  const recipient = order.shippingAddress || {
    recipientName: order.contact?.fullName || "ลูกค้า (ไม่ได้ระบุชื่อ)",
    phoneNumber: order.contact?.phoneNumber || "-",
    addressLine1: "ไม่ได้ระบุที่อยู่จัดส่ง",
    subdistrict: "",
    district: "",
    province: "",
    postalCode: "-",
    note: "",
  }

  const sender = shopInfo || {
    name: "ChatbotX ERP Shop",
    phoneNumber: "02-000-0000",
    address: "กรุงเทพมหานคร 10110",
  }

  const isCod = order.paymentMethod === "cod"

  return (
    <div className="shipping-label print:page-break-after-always mx-auto my-4 box-border flex max-h-[150mm] min-h-[150mm] w-[100mm] flex-col justify-between border-2 border-black bg-white p-3 font-sans text-black text-xs print:my-0 print:h-[150mm] print:w-[100mm] print:border-black">
      {/* 1. Header with Carrier Name & Order Number */}
      <div className="mb-2 border-black border-b-2 pb-2">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-black text-base uppercase tracking-wider">
            {carrierName}
          </span>
          <span className="font-bold font-mono text-[11px]">
            {order.orderNumber}
          </span>
        </div>

        {/* Tracking Barcode */}
        <div className="flex justify-center py-1">
          <Barcode height={42} value={trackingNumber} width={1.8} />
        </div>
      </div>

      {/* 2. Sender (ผู้ส่ง) & Recipient (ผู้รับ) */}
      <div className="mb-2 grid grid-cols-1 gap-2 border-black border-b-2 pb-2">
        {/* Sender Small Box */}
        <div className="border border-gray-400 border-dashed bg-gray-50 p-1.5 text-[10px] leading-tight">
          <div className="font-bold text-gray-700">ผู้ส่ง (FROM):</div>
          <div className="font-semibold">
            {sender.name} ({sender.phoneNumber})
          </div>
          <div className="line-clamp-1 text-gray-600">{sender.address}</div>
        </div>

        {/* Recipient Big Box */}
        <div className="border-2 border-black bg-white p-2">
          <div className="flex items-start justify-between">
            <span className="font-black text-xs underline">ผู้รับ (TO):</span>
            <span className="font-black text-sm">{recipient.phoneNumber}</span>
          </div>
          <div className="mt-0.5 font-black text-sm">
            {recipient.recipientName}
          </div>
          <div className="mt-1 text-xs leading-relaxed">
            {recipient.addressLine1} {recipient.subdistrict}{" "}
            {recipient.district} {recipient.province}
          </div>

          <div className="mt-2 flex items-end justify-between border-gray-300 border-t pt-1">
            <div className="text-[10px] text-gray-500">
              {recipient.note && <span>หมายเหตุ: {recipient.note}</span>}
            </div>
            {/* Postal Code Digits Highlight */}
            <div className="flex gap-1">
              {(recipient.postalCode || "").split("").map((digit, i) => (
                <span
                  className="flex h-6 w-5 items-center justify-center border-2 border-black bg-gray-100 font-black text-sm"
                  // biome-ignore lint/suspicious/noArrayIndexKey: zip digit box
                  key={i}
                >
                  {digit}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. COD / Payment Indicator */}
      <div className="mb-2 flex items-center justify-between border-2 border-black bg-gray-100 p-1.5">
        <div>
          <span className="block font-bold text-[10px]">ประเภทการชำระเงิน:</span>
          <span className="font-extrabold text-xs">
            {isCod ? "เก็บเงินปลายทาง (COD)" : "ชำระเงินเรียบร้อยแล้ว (ไม่ต้องเก็บเงิน)"}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] text-gray-600">ยอดเงิน:</span>
          <span className="font-black text-base text-black">
            ฿{order.totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 4. Packing Slip (รายการสินค้าสำหรับจัดของ) */}
      <div className="flex flex-1 flex-col justify-between border border-black p-1.5 text-[10px]">
        <div>
          <div className="mb-1 flex justify-between border-black border-b pb-0.5 font-bold">
            <span>รายการสินค้า (Packing Slip)</span>
            <span>
              จำนวนรวม: {order.items.reduce((s, i) => s + i.quantity, 0)} ชิ้น
            </span>
          </div>
          <div className="space-y-1">
            {order.items.slice(0, 5).map((item) => (
              <div
                className="flex items-center justify-between text-[10px]"
                key={item.id}
              >
                <div className="flex max-w-[220px] items-center gap-1.5 truncate">
                  <span className="inline-block h-3 w-3 border border-black" />
                  <span className="truncate font-semibold">
                    {item.productName}
                  </span>
                  {item.sku && (
                    <span className="font-mono text-[9px] text-gray-500">
                      [{item.sku}]
                    </span>
                  )}
                </div>
                <span className="font-bold text-[11px]">x{item.quantity}</span>
              </div>
            ))}
            {order.items.length > 5 && (
              <div className="text-[9px] text-gray-500 italic">
                + อีก {order.items.length - 5} รายการ
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between border-gray-300 border-t border-dashed pt-1 text-[9px] text-gray-500">
          <span>
            วันที่สั่ง: {new Date(order.createdAt).toLocaleDateString("th-TH")}
          </span>
          <span>ChatbotX ERP Fulfillment</span>
        </div>
      </div>
    </div>
  )
}
