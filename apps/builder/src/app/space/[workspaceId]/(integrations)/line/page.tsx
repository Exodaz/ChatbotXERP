import { LineOaManage } from "@/features/integrations/components/line-oa-manage"
import { assertCurrentUserCanAccessChatbot } from "@/lib/auth/utils"

export default async function LineIntegrationPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  await assertCurrentUserCanAccessChatbot(workspaceId)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3123"

  return (
    <div className="p-4 sm:p-6">
      <LineOaManage defaultBaseUrl={baseUrl} workspaceId={workspaceId} />
    </div>
  )
}
