import { defineRelationsPart } from "drizzle-orm"
// biome-ignore lint/performance/noNamespaceImport: drizzle schema
import * as schema from "../schema"

export const workspaceRoleRelations = defineRelationsPart(schema, (r) => ({
  workspaceRoleModel: {
    workspace: r.one.workspaceModel({
      from: r.workspaceRoleModel.workspaceId,
      to: r.workspaceModel.id,
    }),
  },
}))
