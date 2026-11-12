import { sql } from "void/db";
import {
  type AnySQLiteColumn,
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "void/schema-d1";

import { userTable } from "../.void/better-auth-schema";
import { PERMISSIONS } from "../src/lib/roles/permissions";

const RESOURCE_KINDS = ["table", "view", "widget"] as const;

const lower = (column: AnySQLiteColumn) => sql`lower(${column})`;
const live = (column: AnySQLiteColumn) => sql`${column} is null`;

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
};

const deletedAt = () => integer("deleted_at", { mode: "timestamp_ms" });

const deletedBy = () => text("deleted_by").references(() => userTable.id, { onDelete: "set null" });

const createdBy = () => text("created_by").references(() => userTable.id, { onDelete: "set null" });

const json = <T>(name: string, fallback: T) =>
  text(name, { mode: "json" }).$type<T>().notNull().default(fallback);

export const workspaceSchema = <W extends string = "default">(workspaceId: W = "default" as W) => {
  const name = <S extends string>(suffix: S) => `${workspaceId}__${suffix}` as `${W}__${S}`;

  const settingTable = sqliteTable(name("setting"), {
    userId: text("user_id")
      .primaryKey()
      .references(() => userTable.id, { onDelete: "cascade" }),
    metadata: json<Record<string, unknown>>("metadata", {}),
  });

  const resourceTable = sqliteTable(
    name("resource"),
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
      kind: text("kind", { enum: RESOURCE_KINDS }).notNull(),
    },
    (t) => [
      check(
        name("resource_kind_check"),
        sql`${t.kind} in (${sql.raw(RESOURCE_KINDS.map((kind) => `'${kind}'`).join(", "))})`,
      ),
    ],
  );

  const tableTable = sqliteTable(
    name("table"),
    {
      id: integer("id")
        .primaryKey()
        .references(() => resourceTable.id, { onDelete: "cascade" }),
      tableName: text("table_name").notNull(),
      name: text("name").notNull(),
      description: text("description"),
      icon: text("icon"),
      groupName: text("group_name"),
      titleColumnId: integer("title_column_id").references((): AnySQLiteColumn => columnTable.id, {
        onDelete: "set null",
      }),
      idType: text("id_type", { enum: ["increment", "uuid"] })
        .notNull()
        .default("increment"),
      position: integer("position").notNull().default(0),
      metadata: json<Record<string, unknown>>("metadata", {}),
      createdBy: createdBy(),
      ...timestamps,
      deletedAt: deletedAt(),
      deletedBy: deletedBy(),
    },
    (t) => [
      uniqueIndex(name("table_name")).on(lower(t.name)).where(live(t.deletedAt)),
      uniqueIndex(name("table_table_name")).on(t.tableName),
      index(name("table_position")).on(t.position).where(live(t.deletedAt)),
      index(name("table_group")).on(t.groupName, t.position).where(live(t.deletedAt)),
      index(name("table_deleted"))
        .on(t.deletedAt)
        .where(sql`${t.deletedAt} is not null`),
    ],
  );

  const columnTable = sqliteTable(
    name("column"),
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
      tableId: integer("table_id")
        .notNull()
        .references(() => tableTable.id, { onDelete: "cascade" }),
      columnName: text("column_name").notNull(),
      name: text("name").notNull(),
      icon: text("icon"),
      type: text("type").notNull(),
      format: text("format").notNull(),
      isRequired: integer("is_required", { mode: "boolean" }).notNull().default(false),
      isFilterable: integer("is_filterable", { mode: "boolean" }).notNull().default(false),
      isSortable: integer("is_sortable", { mode: "boolean" }).notNull().default(false),
      isSearchable: integer("is_searchable", { mode: "boolean" }).notNull().default(false),
      isUnique: integer("is_unique", { mode: "boolean" }).notNull().default(false),
      isHidden: integer("is_hidden", { mode: "boolean" }).notNull().default(false),
      isGenerated: integer("is_generated", { mode: "boolean" }).notNull().default(false),
      defaultValue: text("default_value"),
      position: integer("position").notNull().default(0),
      description: text("description"),
      options: json<Record<string, unknown>>("options", {}),
      metadata: json<Record<string, unknown>>("metadata", {}),
      ...timestamps,
      deletedAt: deletedAt(),
      deletedBy: deletedBy(),
    },
    (t) => [
      uniqueIndex(name("column_name")).on(t.tableId, lower(t.name)).where(live(t.deletedAt)),
      uniqueIndex(name("column_column_name")).on(t.tableId, t.columnName),
      index(name("column_position")).on(t.tableId, t.position).where(live(t.deletedAt)),
    ],
  );

  const viewTable = sqliteTable(
    name("view"),
    {
      id: integer("id")
        .primaryKey()
        .references(() => resourceTable.id, { onDelete: "cascade" }),
      tableId: integer("table_id")
        .notNull()
        .references(() => tableTable.id, { onDelete: "cascade" }),
      viewName: text("view_name").notNull(),
      name: text("name").notNull(),
      description: text("description"),
      icon: text("icon"),
      type: text("type"),
      position: integer("position").notNull().default(0),
      selectColumns: json<string[]>("select_columns", []),
      whereExpression: text("where_expression"),
      metadata: json<Record<string, unknown>>("metadata", {}),
      createdBy: createdBy(),
      ...timestamps,
      deletedAt: deletedAt(),
      deletedBy: deletedBy(),
    },
    (t) => [
      uniqueIndex(name("view_name")).on(t.tableId, lower(t.name)).where(live(t.deletedAt)),
      uniqueIndex(name("view_view_name")).on(t.viewName),
      index(name("view_table_position")).on(t.tableId, t.position).where(live(t.deletedAt)),
    ],
  );

  const widgetTable = sqliteTable(
    name("widget"),
    {
      id: integer("id")
        .primaryKey()
        .references(() => resourceTable.id, { onDelete: "cascade" }),
      tableId: integer("table_id")
        .notNull()
        .references(() => tableTable.id, { onDelete: "cascade" }),
      viewName: text("view_name").notNull(),
      title: text("title").notNull(),
      kind: text("kind").notNull(),
      variant: text("variant").notNull(),
      definition: json<Record<string, unknown>>("definition", {}),
      layout: json<Record<string, unknown>>("layout", {}),
      options: json<Record<string, unknown>>("options", {}),
      position: integer("position").notNull().default(0),
      createdBy: createdBy(),
      ...timestamps,
      deletedAt: deletedAt(),
      deletedBy: deletedBy(),
    },
    (t) => [
      uniqueIndex(name("widget_view_name")).on(t.viewName),
      index(name("widget_table_position")).on(t.tableId, t.position).where(live(t.deletedAt)),
    ],
  );

  const favoriteTable = sqliteTable(
    name("favorite"),
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: text("user_id")
        .notNull()
        .references(() => userTable.id, { onDelete: "cascade" }),
      tableId: integer("table_id")
        .notNull()
        .references(() => tableTable.id, { onDelete: "cascade" }),
      createdAt: timestamps.createdAt,
    },
    (t) => [uniqueIndex(name("favorite_user_table")).on(t.userId, t.tableId)],
  );

  const trashTable = sqliteTable(
    name("trash"),
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
      tableId: integer("table_id")
        .notNull()
        .references(() => tableTable.id, { onDelete: "cascade" }),
      recordId: text("record_id").notNull(),
      data: json<Record<string, unknown>>("data", {}),
      deletedBy: text("deleted_by").references(() => userTable.id, { onDelete: "set null" }),
      deletedAt: integer("deleted_at", { mode: "timestamp_ms" })
        .notNull()
        .$defaultFn(() => new Date()),
    },
    (t) => [index(name("trash_table_deleted")).on(t.tableId, t.deletedAt)],
  );

  const roleTable = sqliteTable(
    name("role"),
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull(),
      description: text("description"),
      isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
      isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
      position: integer("position").notNull().default(0),
      ...timestamps,
    },
    (t) => [
      uniqueIndex(name("role_name")).on(lower(t.name)),
      uniqueIndex(name("role_default"))
        .on(t.isDefault)
        .where(sql`${t.isDefault} = 1`),
    ],
  );

  const roleMemberTable = sqliteTable(
    name("role_member"),
    {
      userId: text("user_id")
        .primaryKey()
        .references(() => userTable.id, { onDelete: "cascade" }),
      roleId: integer("role_id")
        .notNull()
        .references(() => roleTable.id, { onDelete: "restrict" }),
      assignedBy: text("assigned_by").references(() => userTable.id, { onDelete: "set null" }),
      assignedAt: integer("assigned_at", { mode: "timestamp_ms" })
        .notNull()
        .$defaultFn(() => new Date()),
    },
    (t) => [index(name("role_member_role")).on(t.roleId)],
  );

  const rolePermissionTable = sqliteTable(
    name("role_permission"),
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
      roleId: integer("role_id")
        .notNull()
        .references(() => roleTable.id, { onDelete: "cascade" }),
      resourceId: integer("resource_id").references(() => resourceTable.id, {
        onDelete: "cascade",
      }),
      permission: text("permission", { enum: PERMISSIONS }).notNull(),
      action: text("action").generatedAlwaysAs(
        sql`(case when instr("permission", ':') > 0 then substr("permission", 1, instr("permission", ':') - 1) else "permission" end)`,
        { mode: "virtual" },
      ),
    },
    (t) => [
      check(
        name("role_permission_check"),
        sql`${t.permission} in (${sql.raw(PERMISSIONS.map((item) => `'${item}'`).join(", "))})`,
      ),
      uniqueIndex(name("role_permission_unique")).on(
        t.roleId,
        sql`(case when ${t.resourceId} is null then 0 else ${t.resourceId} end)`,
        t.action,
      ),
    ],
  );

  return {
    settingTable,
    resourceTable,
    tableTable,
    columnTable,
    viewTable,
    widgetTable,
    favoriteTable,
    trashTable,
    roleTable,
    roleMemberTable,
    rolePermissionTable,
  };
};

export const {
  settingTable,
  resourceTable,
  tableTable,
  columnTable,
  viewTable,
  widgetTable,
  favoriteTable,
  trashTable,
  roleTable,
  roleMemberTable,
  rolePermissionTable,
} = workspaceSchema();
