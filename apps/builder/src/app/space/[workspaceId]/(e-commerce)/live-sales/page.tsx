import { orderAnalyticsService } from "@chatbotx.io/business"
import { LiveSalesDashboard } from "@/features/orders/components/live-sales-dashboard"
import { assertCurrentUserCanAccessChatbot } from "@/lib/auth/utils"

export default async function LiveSalesPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>
  searchParams: Promise<{ sessionId?: string }>
}) {
  const { workspaceId } = await params
  const { sessionId } = await searchParams
  await assertCurrentUserCanAccessChatbot(workspaceId)

  const analytics = await orderAnalyticsService.getLiveSalesAnalytics({
    workspaceId,
    liveSessionId: sessionId || null,
  })

  return (
    <div className="p-2 sm:p-4">
      <LiveSalesDashboard
        currentSessionId={sessionId}
        initialData={analytics}
        workspaceId={workspaceId}
      />
    </div>
  )
}
