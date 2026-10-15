import { orderService } from "@chatbotx.io/business"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const body = await request.json()

    const updated = await orderService.updateShippingAddress(token, {
      recipientName: body.recipientName,
      phoneNumber: body.phoneNumber,
      addressLine1: body.addressLine1,
      postalCode: body.postalCode,
      subdistrict: body.subdistrict,
      district: body.district,
      province: body.province,
      note: body.note,
    })

    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, order: updated })
  } catch {
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 },
    )
  }
}
