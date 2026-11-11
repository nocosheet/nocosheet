import { randomUUID } from "node:crypto";
import type { SeedContext } from "void/seed";

import {
  buildAddColumn,
  buildCreateTable,
  columnSqliteType,
  type RelationTarget,
} from "../../src/lib/tables/ddl";
import { SEARCHABLE_FORMATS, type ColumnFormat } from "../../src/lib/tables/formats";
import {
  physicalTableName,
  quoteIdent,
  toColumnName,
  toSlug,
  toTableName,
} from "../../src/lib/tables/naming";
import { columnInputSchema } from "../../src/lib/tables/validation";
import type { SeedUsers } from "./users";

type Schema = typeof import("../schema");
type SqliteContext = Extract<SeedContext<Schema>, { dialect: "sqlite" }>;
export type SeedDb = SqliteContext["db"];
export type SeedSchema = SqliteContext["schema"];

export const WORKSPACE = "default";

const DAY = 86_400_000;
const NOW = Date.now();

export const day = (offset: number) => new Date(NOW + offset * DAY).toISOString().slice(0, 10);

export const at = (offset: number, hour = 9) => {
  const date = new Date(NOW + offset * DAY);
  date.setUTCHours(hour, 0, 0, 0);
  return date.getTime();
};

export const choices = (...labels: string[]) => ({
  choices: labels.map((label) => ({ label, value: toSlug(label) })),
});

export type SeedColumn = {
  name: string;
  format: ColumnFormat;
  options?: Record<string, unknown>;
  relation?: string;
  description?: string;
  required?: boolean;
  unique?: boolean;
  hidden?: boolean;
  searchable?: boolean;
  default?: string;
  generated?: string;
  check?: string;
};

export type SeedRow = Record<string, unknown>;

export type SeedTable = {
  name: string;
  icon: string;
  group?: string;
  description: string;
  idType?: "increment" | "uuid";
  title: string;
  columns: SeedColumn[];
  rows: SeedRow[];
};

type Seeded = {
  id: number;
  idType: "increment" | "uuid";
  physicalName: string;
  titles: Map<string, string | number>;
};

export type SeedState = Map<string, Seeded>;

const text = (value: unknown) => (typeof value === "string" ? value : JSON.stringify(value));

const literal = (value: unknown): string => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Seed value ${value} is not a finite number`);
    return String(value);
  }
  if (value instanceof Date) return String(value.getTime());
  if (typeof value === "object") return literal(JSON.stringify(value));
  return `'${text(value).replaceAll("'", "''")}'`;
};

export async function seedTable(
  db: SeedDb,
  schema: SeedSchema,
  state: SeedState,
  def: SeedTable,
  position: number,
  users: SeedUsers,
) {
  const idType = def.idType ?? "increment";
  const tableName = toTableName(def.name);
  const physicalName = physicalTableName(WORKSPACE, tableName);

  const [resource] = await db
    .insert(schema.resourceTable)
    .values({ kind: "table" })
    .returning({ id: schema.resourceTable.id });

  await db.insert(schema.tableTable).values({
    id: resource.id,
    tableName,
    name: def.name,
    description: def.description,
    icon: def.icon,
    groupName: def.group ?? null,
    idType,
    position,
    createdBy: users.admin,
    createdAt: new Date(at(-90 + position)),
    updatedAt: new Date(at(-3 - position)),
  });

  db.run(buildCreateTable({ idType, physicalName }));

  const targets = new Map<number, RelationTarget>();
  for (const seeded of state.values())
    targets.set(seeded.id, { physicalName: seeded.physicalName, idType: seeded.idType });

  const columns = def.columns.map((spec, index) => {
    const relation = spec.relation ? state.get(spec.relation) : undefined;
    if (spec.relation && !relation) throw new Error(`${def.name}: unknown table ${spec.relation}`);

    const column = columnInputSchema.parse({
      name: spec.name,
      description: spec.description,
      format: spec.format,
      options: relation
        ? { tableId: relation.id, onDelete: "set null", ...spec.options }
        : (spec.options ?? {}),
      isRequired: spec.required ?? false,
      isUnique: spec.unique ?? false,
      isHidden: spec.hidden ?? false,
      isSearchable: spec.searchable ?? (SEARCHABLE_FORMATS.includes(spec.format) && index === 0),
      defaultValue: spec.default,
      generatedExpression: spec.generated,
      checkExpression: spec.check,
      position: index,
    });
    return { spec, column, relation };
  });

  const columnIds = new Map<string, number>();
  for (const { column } of columns) {
    for (const statement of buildAddColumn(physicalName, column, targets)) db.run(statement);

    const [created] = await db
      .insert(schema.columnTable)
      .values({
        tableId: resource.id,
        columnName: toColumnName(column.name),
        name: column.name,
        icon: column.icon,
        description: column.description,
        type: columnSqliteType(column, targets),
        format: column.format,
        options: column.options,
        isRequired: column.isRequired,
        isFilterable: column.isFilterable,
        isSortable: column.isSortable,
        isSearchable: column.isSearchable,
        isUnique: column.isUnique,
        isHidden: column.isHidden,
        defaultValue: column.defaultValue,
        checkExpression: column.checkExpression,
        generatedExpression: column.generatedExpression,
        position: column.position,
      })
      .returning({ id: schema.columnTable.id });
    columnIds.set(column.name, created.id);
  }

  const titleId = columnIds.get(def.title);
  if (titleId === undefined) throw new Error(`${def.name}: missing title column ${def.title}`);
  db.run(
    `UPDATE ${quoteIdent(`${WORKSPACE}__table`)} SET title_column_id = ${titleId} WHERE id = ${resource.id}`,
  );

  const seeded: Seeded = { id: resource.id, idType, physicalName, titles: new Map() };
  const writable = columns.filter(({ column }) => !column.generatedExpression);

  def.rows.forEach((row, index) => {
    const id = idType === "uuid" ? randomUUID() : index + 1;
    const created = at(
      -Math.round(((def.rows.length - index) * 60) / def.rows.length),
      9 + (index % 8),
    );
    const authors = [users.admin, users.member, ...users.others];
    const names: string[] = ["id", "created_at", "updated_at", "created_by", "updated_by"];
    const values: unknown[] = [
      id,
      created,
      created + (index % 5) * 6 * 3_600_000,
      authors[index % authors.length],
      authors[(index + 3) % authors.length],
    ];

    for (const { spec, column, relation } of writable) {
      const value = row[column.name];
      if (value === undefined) continue;
      names.push(toColumnName(column.name));
      if (relation) {
        const target = relation.titles.get(text(value));
        if (target === undefined)
          throw new Error(
            `${def.name}.${column.name}: no ${spec.relation} titled "${text(value)}"`,
          );
        values.push(target);
      } else {
        values.push(value);
      }
    }

    db.run(
      `INSERT INTO ${quoteIdent(physicalName)} (${names.map(quoteIdent).join(", ")}) VALUES (${values.map(literal).join(", ")})`,
    );
    seeded.titles.set(text(row[def.title]), id);
  });

  state.set(def.name, seeded);
  console.log(`  ${def.name}: ${def.columns.length} columns, ${def.rows.length} records`);
}
