import { orderService } from "@chatbotx.io/business"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { slipUrl } = body

    if (!slipUrl) {
      return NextResponse.json(
        { error: "Slip URL is required" },
        { status: 400 },
      )
    }

    // Call Easyslip API check if configured
    const easyslipApiKey = process.env.EASYSLIP_API_KEY
    let verifiedData: Record<string, unknown> | undefined

    if (easyslipApiKey) {
      try {
        const verifyRes = await fetch(
          "https://developer.easyslip.com/api/v1/verify",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${easyslipApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: slipUrl }),
          },
        )
        if (verifyRes.ok) {
          const resJson = await verifyRes.json()
          if (resJson.status === 200 && resJson.data) {
            verifiedData = {
              isValid: true,
              amount: resJson.data.amount?.amount,
              transDate: resJson.data.date,
              raw: resJson.data,
            }
          }
        }
      } catch (err) {
        // Fallback to manual approval if verification API fails
        console.error("Easyslip verification error:", err)
      }
    }

    const updated = await orderService.submitBankTransferSlip(
      token,
      slipUrl,
      verifiedData,
    )

    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, order: updated })
  } catch {
    return NextResponse.json(
      { error: "Failed to submit slip" },
      { status: 500 },
    )
  }
}
