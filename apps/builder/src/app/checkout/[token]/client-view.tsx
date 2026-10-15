"use client"

import type { OrderItemModel, OrderModel } from "@chatbotx.io/database/types"
import { useState } from "react"

export function CheckoutClientView({
  order,
  items,
  token,
}: {
  order: OrderModel
  items: OrderItemModel[]
  token: string
}) {
  const [recipientName, setRecipientName] = useState(
    order.shippingAddress?.recipientName ?? "",
  )
  const [phoneNumber, setPhoneNumber] = useState(
    order.shippingAddress?.phoneNumber ?? "",
  )
  const [addressLine1, setAddressLine1] = useState(
    order.shippingAddress?.addressLine1 ?? "",
  )
  const [postalCode, setPostalCode] = useState(
    order.shippingAddress?.postalCode ?? "",
  )
  const [paymentMethod, setPaymentMethod] = useState<
    "bank_transfer" | "moneyspace_credit_card" | "qr_code"
  >("bank_transfer")
  const [slipUrl, setSlipUrl] = useState(order.slipUrl ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [statusNotice, setStatusNotice] = useState<string | null>(null)

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch(`/api/checkout/${token}/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName,
          phoneNumber,
          addressLine1,
          postalCode,
        }),
      })
      if (res.ok) {
        setIsSuccess(true)
        setTimeout(() => setIsSuccess(false), 3000)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmitSlip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slipUrl) {
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch(`/api/checkout/${token}/slip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slipUrl }),
      })
      if (res.ok) {
        setStatusNotice("ส่งสลิปเรียบร้อยแล้ว! กำลังตรวจสอบข้อมูล")
        window.location.reload()
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 p-6">
      {/* รายการสินค้าที่ CF */}
      <div>
        <h2 className="mb-4 border-b pb-2 font-semibold text-base text-slate-900">
          รายการสินค้า ({items.length} รายการ)
        </h2>
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div
              className="flex items-center justify-between py-3 text-sm"
              key={item.id}
            >
              <div>
                <div className="font-medium text-slate-800">
                  {item.productName}
                </div>
                {item.liveCode && (
                  <span className="mt-0.5 inline-block rounded bg-blue-50 px-2 py-0.5 font-mono text-blue-700 text-xs">
                    รหัส CF: {item.liveCode}
                  </span>
                )}
                {item.variantDescription && (
                  <div className="text-slate-500 text-xs">
                    {item.variantDescription}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-900">
                  ฿{item.totalPrice.toLocaleString()}
                </div>
                <div className="text-slate-500 text-xs">
                  ฿{item.unitPrice.toLocaleString()} x {item.quantity}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ยอดรวม */}
        <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>ยอดรวมสินค้า</span>
            <span>฿{order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>ค่าจัดส่ง</span>
            <span>฿{order.shippingFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold text-base text-slate-900">
            <span>ยอดชำระทั้งหมด</span>
            <span className="text-blue-600">
              ฿{order.totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* กรอกที่อยู่จัดส่ง */}
      <div>
        <h2 className="mb-4 border-b pb-2 font-semibold text-base text-slate-900">
          ที่อยู่จัดส่งพัสดุ (Shipping Address)
        </h2>
        <form className="space-y-4 text-sm" onSubmit={handleSaveAddress}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block font-medium text-slate-700 text-xs"
                htmlFor="recipientNameInput"
              >
                ชื่อ-นามสกุล ผู้รับ
              </label>
              <input
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="recipientNameInput"
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="สมชาย ใจดี"
                required
                type="text"
                value={recipientName}
              />
            </div>
            <div>
              <label
                className="mb-1 block font-medium text-slate-700 text-xs"
                htmlFor="phoneNumberInput"
              >
                เบอร์โทรศัพท์
              </label>
              <input
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="phoneNumberInput"
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0812345678"
                required
                type="tel"
                value={phoneNumber}
              />
            </div>
          </div>
          <div>
            <label
              className="mb-1 block font-medium text-slate-700 text-xs"
              htmlFor="addressLine1Input"
            >
              ที่อยู่ / ถนน / ซอย
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="addressLine1Input"
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="เลขที่ หมู่บ้าน ซอย ถนน..."
              required
              type="text"
              value={addressLine1}
            />
          </div>
          <div>
            <label
              className="mb-1 block font-medium text-slate-700 text-xs"
              htmlFor="postalCodeInput"
            >
              รหัสไปรษณีย์
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="postalCodeInput"
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="10110"
              required
              type="text"
              value={postalCode}
            />
          </div>
          <button
            className="rounded-lg bg-slate-800 px-4 py-2 font-medium text-sm text-white transition hover:bg-slate-700 disabled:opacity-50"
            disabled={isSaving}
            type="submit"
          >
            {(() => {
              if (isSaving) {
                return "กำลังบันทึก..."
              }
              if (isSuccess) {
                return "✓ บันทึกที่อยู่สำเร็จ"
              }
              return "บันทึกที่อยู่"
            })()}
          </button>
        </form>
      </div>

      {/* เลือกช่องทางชำระเงิน */}
      <div>
        <h2 className="mb-4 border-b pb-2 font-semibold text-base text-slate-900">
          ช่องทางการชำระเงิน (Payment Method)
        </h2>
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            className={`rounded-xl border p-3 text-left font-medium text-sm transition ${
              paymentMethod === "bank_transfer"
                ? "border-blue-600 bg-blue-50/50 text-blue-900"
                : "border-slate-200 text-slate-700 hover:border-slate-300"
            }`}
            onClick={() => setPaymentMethod("bank_transfer")}
            type="button"
          >
            <div className="text-base">🏦</div>
            <div className="mt-1 font-semibold">โอนบัญชีธนาคาร</div>
            <div className="text-slate-500 text-xs">แนบสลิปตรวจอัตโนมัติ</div>
          </button>

          <button
            className={`rounded-xl border p-3 text-left font-medium text-sm transition ${
              paymentMethod === "moneyspace_credit_card"
                ? "border-blue-600 bg-blue-50/50 text-blue-900"
                : "border-slate-200 text-slate-700 hover:border-slate-300"
            }`}
            onClick={() => setPaymentMethod("moneyspace_credit_card")}
            type="button"
          >
            <div className="text-base">💳</div>
            <div className="mt-1 font-semibold">บัตรเครดิต</div>
            <div className="text-slate-500 text-xs">Moneyspace Gateway</div>
          </button>

          <button
            className={`rounded-xl border p-3 text-left font-medium text-sm transition ${
              paymentMethod === "qr_code"
                ? "border-blue-600 bg-blue-50/50 text-blue-900"
                : "border-slate-200 text-slate-700 hover:border-slate-300"
            }`}
            onClick={() => setPaymentMethod("qr_code")}
            type="button"
          >
            <div className="text-base">📱</div>
            <div className="mt-1 font-semibold">QR Code</div>
            <div className="text-slate-500 text-xs">แอดมินส่งให้ในแชท</div>
          </button>
        </div>

        {/* รายละเอียดแต่ละช่องทาง */}
        {paymentMethod === "bank_transfer" && (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="space-y-1">
              <div className="text-slate-500 text-xs">ข้อมูลบัญชีธนาคาร:</div>
              <div className="font-semibold text-slate-800">
                ธนาคารกสิกรไทย (KBANK)
              </div>
              <div className="font-bold font-mono text-base text-blue-600">
                123-4-56789-0
              </div>
              <div className="text-slate-600 text-xs">
                ชื่อบัญชี: บจก. แชทบอท เอกซ์ อีอาร์พี
              </div>
            </div>

            <form
              className="space-y-3 border-t pt-3"
              onSubmit={handleSubmitSlip}
            >
              <label
                className="block font-medium text-slate-700 text-xs"
                htmlFor="slip-url-input"
              >
                แนบสลิปการโอนเงิน (URL หรือ อัปโหลด)
              </label>
              <input
                className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="slip-url-input"
                onChange={(e) => setSlipUrl(e.target.value)}
                placeholder="วางลิงก์รูปสลิป หรือ อัปโหลด"
                required
                type="text"
                value={slipUrl}
              />
              <button
                className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-sm text-white transition hover:bg-blue-500"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "กำลังส่งสลิป..." : "ยืนยันการโอนเงินและส่งสลิป"}
              </button>
            </form>
          </div>
        )}

        {paymentMethod === "moneyspace_credit_card" && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm">
            <div className="text-2xl">💳</div>
            <div className="font-semibold text-slate-800">
              ชำระผ่าน Moneyspace Payment Gateway
            </div>
            <p className="mx-auto max-w-sm text-slate-500 text-xs">
              รองรับบัตรเครดิต Visa, Mastercard และ JCB
              ระบบจะนำท่านไปยังหน้าชำระเงินที่ปลอดภัยของ Moneyspace
            </p>
            <button
              className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-sm text-white transition hover:bg-blue-500"
              onClick={() =>
                setStatusNotice("กำลังเชื่อมต่อ Moneyspace Payment Gateway...")
              }
              type="button"
            >
              ไปที่หน้าชำระเงิน Moneyspace (฿{order.totalAmount.toLocaleString()})
            </button>
          </div>
        )}

        {paymentMethod === "qr_code" && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm">
            <div className="text-2xl">📱</div>
            <div className="font-semibold text-slate-800">
              ขอรับ QR Code สำหรับชำระเงิน
            </div>
            <p className="mx-auto max-w-sm text-slate-500 text-xs">
              แอดมินจะสร้างและอนุมัติ QR Code จากระบบหลังบ้าน จากนั้นจะส่งเข้าในแชท
              Messenger ของท่านทันที
            </p>
            <button
              className="rounded-lg bg-slate-800 px-6 py-2.5 font-semibold text-sm text-white transition hover:bg-slate-700"
              onClick={() =>
                setStatusNotice(
                  "ระบบได้แจ้งเตือนแอดมินเพื่อส่ง QR Code ให้ท่านทางแชทแล้ว",
                )
              }
              type="button"
            >
              แจ้งแอดมินขอรับ QR Code ในแชท
            </button>
          </div>
        )}

        {statusNotice && (
          <div className="rounded-lg bg-blue-50 p-3 text-center text-blue-700 text-xs dark:bg-blue-950/50 dark:text-blue-300">
            {statusNotice}
          </div>
        )}
      </div>
    </div>
  )
}
