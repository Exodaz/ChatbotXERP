import { stockSyncService } from "@chatbotx.io/business"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const bearerKey = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null

    const body = await request.json().catch(() => ({}))
    const apiKey = bearerKey || body.apiKey || request.headers.get("x-api-key")

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing Stockroom API key (provide via Bearer token or apiKey in body)",
        },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = body.workspaceId || searchParams.get("workspaceId")

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 },
      )
    }

    const result = await stockSyncService.syncStock({
      workspaceId,
      apiKey,
      updatedSince:
        body.updatedSince || searchParams.get("updatedSince") || undefined,
      category: body.category || searchParams.get("category") || undefined,
      overbookingAllowance: body.overbookingAllowance ?? 0,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    )
  }
}
