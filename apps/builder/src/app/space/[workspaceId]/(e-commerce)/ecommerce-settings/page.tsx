import { EcommerceSettingsView } from "@/features/products/components/ecommerce-settings-view"
import { assertCurrentUserCanAccessChatbot } from "@/lib/auth/utils"

export default async function EcommerceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  await assertCurrentUserCanAccessChatbot(workspaceId)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3123"

  return (
    <div className="p-2 sm:p-4">
      <EcommerceSettingsView
        defaultBaseUrl={baseUrl}
        workspaceId={workspaceId}
      />
    </div>
  )
}
