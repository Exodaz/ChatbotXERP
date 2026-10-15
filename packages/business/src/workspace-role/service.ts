import { type DatabaseClient, db, eq } from "@chatbotx.io/database/client"
import { workspaceRoleModel } from "@chatbotx.io/database/schema"
import type { WorkspaceRoleModel } from "@chatbotx.io/database/types"
import { createId } from "@chatbotx.io/utils"
import { BaseService } from "../base.service"

export type WorkspaceRoleCreateInput = {
  workspaceId: string
  name: string
  description?: string | null
  permissions: Record<string, boolean>
  isSystem?: boolean
}

export type WorkspaceRoleUpdateInput = {
  name?: string
  description?: string | null
  permissions?: Record<string, boolean>
}

class WorkspaceRoleService extends BaseService {
  async listByWorkspace(
    workspaceId: string,
    tx: DatabaseClient = db,
  ): Promise<WorkspaceRoleModel[]> {
    return await tx
      .select()
      .from(workspaceRoleModel)
      .where(eq(workspaceRoleModel.workspaceId, workspaceId))
  }

  async findById(
    id: string,
    tx: DatabaseClient = db,
  ): Promise<WorkspaceRoleModel | null> {
    const [role] = await tx
      .select()
      .from(workspaceRoleModel)
      .where(eq(workspaceRoleModel.id, id))
    return role ?? null
  }

  async create(
    input: WorkspaceRoleCreateInput,
    tx: DatabaseClient = db,
  ): Promise<WorkspaceRoleModel> {
    const [created] = await tx
      .insert(workspaceRoleModel)
      .values({
        id: createId(),
        ...input,
      })
      .returning()
    return created
  }

  async update(
    id: string,
    input: WorkspaceRoleUpdateInput,
    tx: DatabaseClient = db,
  ): Promise<WorkspaceRoleModel | null> {
    const [updated] = await tx
      .update(workspaceRoleModel)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(workspaceRoleModel.id, id))
      .returning()
    return updated ?? null
  }

  async delete(id: string, tx: DatabaseClient = db): Promise<boolean> {
    const result = await tx
      .delete(workspaceRoleModel)
      .where(eq(workspaceRoleModel.id, id))
      .returning()
    return result.length > 0
  }
}

export const workspaceRoleService = new WorkspaceRoleService()
