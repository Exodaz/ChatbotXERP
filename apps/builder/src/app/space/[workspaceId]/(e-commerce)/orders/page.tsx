import { orderService } from "@chatbotx.io/business"
import { ManageOrders } from "@/features/orders/components/manage-orders"
import { assertCurrentUserCanAccessChatbot } from "@/lib/auth/utils"

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  await assertCurrentUserCanAccessChatbot(workspaceId)

  const { orders, total } = await orderService.listOrders({
    workspaceId,
    limit: 100,
  })

  return (
    <div className="p-2 sm:p-4">
      <ManageOrders
        initialOrders={orders}
        total={total}
        workspaceId={workspaceId}
      />
    </div>
  )
}
