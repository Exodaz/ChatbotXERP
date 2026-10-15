import { lineCFHandler, lineClient } from "@chatbotx.io/business/line"
import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json({
    ok: true,
    message: "LINE Webhook Endpoint is active",
  })
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspaceId")

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required as a query parameter" },
        { status: 400 },
      )
    }

    const channelSecret =
      request.headers.get("x-line-channel-secret") ||
      searchParams.get("channelSecret") ||
      process.env.LINE_CHANNEL_SECRET ||
      ""

    const channelAccessToken =
      request.headers.get("x-line-channel-access-token") ||
      searchParams.get("channelAccessToken") ||
      process.env.LINE_CHANNEL_ACCESS_TOKEN ||
      ""

    const rawBody = await request.text()
    const signature = request.headers.get("x-line-signature")

    // If channelSecret is configured, verify HMAC-SHA256 signature
    if (channelSecret) {
      const isValid = lineClient.verifySignature(
        rawBody,
        signature,
        channelSecret,
      )
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid LINE signature" },
          { status: 403 },
        )
      }
    }

    const payload = JSON.parse(rawBody || "{}")
    const events = payload.events || []

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3123"

    // Process events asynchronously
    const result = await lineCFHandler.handleEvents({
      workspaceId,
      channelAccessToken,
      events,
      liveSessionId: searchParams.get("liveSessionId"),
      appUrl,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (err: unknown) {
    console.error("LINE Webhook error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    )
  }
}
