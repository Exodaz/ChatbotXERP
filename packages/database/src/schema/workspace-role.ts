import { sql } from "drizzle-orm"
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { bigintAsString, sharedColumns } from "../partials/shared"
import { workspaceModel } from "./workspace"

export const workspaceRoleModel = pgTable(
  "WorkspaceRole",
  {
    ...sharedColumns,
    workspaceId: bigintAsString()
      .notNull()
      .references(() => workspaceModel.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text().notNull(),
    description: text(),
    permissions: jsonb()
      .$type<Record<string, boolean>>()
      .default(sql`'{}'`)
      .notNull(),
    isSystem: boolean().default(false).notNull(),
  },
  (table) => [
    index("WorkspaceRole_workspaceId_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast(),
    ),
    uniqueIndex("WorkspaceRole_workspaceId_name_key").on(
      table.workspaceId,
      table.name,
    ),
  ],
)
