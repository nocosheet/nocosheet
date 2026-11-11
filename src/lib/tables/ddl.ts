import { FORMATS, type SelectChoice, type SqliteType } from "./formats";
import { quoteIdent, toColumnName } from "./naming";
import type { ColumnValues } from "./validation";

export class DdlError extends Error {}

export type RelationTarget = { physicalName: string; idType: "increment" | "uuid" };

export type CreateTableSpec = {
  physicalName: string;
  idType: "increment" | "uuid";
};

const UUID_DEFAULT =
  "(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))))";

const NOW_MS = "(cast(unixepoch('subsec') * 1000 as integer))";

const quoteString = (value: string) => `'${value.replaceAll("'", "''")}'`;

export function columnSqliteType(
  column: Pick<ColumnValues, "format" | "options">,
  targets: Map<number, RelationTarget>,
): SqliteType {
  if (column.format === "relation") {
    const target = targets.get(Number(column.options.tableId));
    if (!target) throw new DdlError("The linked table does not exist");
    return target.idType === "uuid" ? "text" : "integer";
  }
  return FORMATS[column.format].type as SqliteType;
}

function defaultLiteral(column: ColumnValues, type: SqliteType) {
  const value = column.defaultValue;
  if (value === null) return null;

  if (column.format === "checkbox") {
    if (value !== "true" && value !== "false")
      throw new DdlError(`Invalid default for "${column.name}"`);
    return value === "true" ? "1" : "0";
  }

  if (column.format === "single_select") {
    const choices = (column.options.choices ?? []) as SelectChoice[];
    if (!choices.some((choice) => choice.value === value))
      throw new DdlError(`Default for "${column.name}" must be one of its choices`);
    return quoteString(value);
  }

  if (type === "integer") {
    if (!/^-?\d+$/.test(value))
      throw new DdlError(`Default for "${column.name}" must be a whole number`);
    return value;
  }

  if (type === "real") {
    if (value.trim() === "" || !Number.isFinite(Number(value)))
      throw new DdlError(`Default for "${column.name}" must be a number`);
    return String(Number(value));
  }

  return quoteString(value);
}

function relationClause(column: ColumnValues, targets: Map<number, RelationTarget>) {
  const target = targets.get(Number(column.options.tableId));
  if (!target) throw new DdlError("The linked table does not exist");
  const onDelete = String(column.options.onDelete).toUpperCase();
  return `REFERENCES ${quoteIdent(target.physicalName)} ("id") ON DELETE ${onDelete}`;
}

function columnDefinition(column: ColumnValues, targets: Map<number, RelationTarget>) {
  const type = columnSqliteType(column, targets);
  const parts = [quoteIdent(toColumnName(column.name)), type.toUpperCase()];

  if (column.generatedExpression) {
    parts.push(`GENERATED ALWAYS AS (${column.generatedExpression}) VIRTUAL`);
  } else {
    const literal = defaultLiteral(column, type);
    if (literal !== null) parts.push(`DEFAULT ${literal}`);
  }

  if (column.format === "checkbox")
    parts.push(`CHECK (${quoteIdent(toColumnName(column.name))} IN (0, 1))`);
  if (column.checkExpression) parts.push(`CHECK (${column.checkExpression})`);
  if (column.format === "relation") parts.push(relationClause(column, targets));

  return parts.join(" ");
}

const trackingDefinitions = () => [
  `"created_at" INTEGER NOT NULL DEFAULT ${NOW_MS}`,
  `"updated_at" INTEGER NOT NULL DEFAULT ${NOW_MS}`,
  `"created_by" TEXT REFERENCES "user" ("id") ON DELETE SET NULL`,
  `"updated_by" TEXT REFERENCES "user" ("id") ON DELETE SET NULL`,
];

export function buildCreateTable(spec: CreateTableSpec) {
  const id =
    spec.idType === "uuid"
      ? `"id" TEXT PRIMARY KEY NOT NULL DEFAULT ${UUID_DEFAULT}`
      : `"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL`;

  return `CREATE TABLE ${quoteIdent(spec.physicalName)} (\n  ${[id, ...trackingDefinitions()].join(",\n  ")}\n)`;
}

export type IndexKind = "uq" | "idx";

export const indexKind = (flags: {
  isUnique: boolean;
  isFilterable: boolean;
  isSortable: boolean;
}): IndexKind | null =>
  flags.isUnique ? "uq" : flags.isFilterable || flags.isSortable ? "idx" : null;

const indexName = (physicalName: string, columnName: string, kind: IndexKind) =>
  quoteIdent(`${physicalName}__${columnName}_${kind}`);

export const buildCreateIndex = (physicalName: string, columnName: string, kind: IndexKind) =>
  `CREATE ${kind === "uq" ? "UNIQUE " : ""}INDEX ${indexName(physicalName, columnName, kind)} ON ${quoteIdent(physicalName)} (${quoteIdent(columnName)})`;

export const buildDropIndex = (physicalName: string, columnName: string, kind: IndexKind) =>
  `DROP INDEX IF EXISTS ${indexName(physicalName, columnName, kind)}`;

export const buildDropColumn = (physicalName: string, columnName: string) =>
  `ALTER TABLE ${quoteIdent(physicalName)} DROP COLUMN ${quoteIdent(columnName)}`;

export function buildAddColumn(
  physicalName: string,
  column: ColumnValues,
  targets: Map<number, RelationTarget>,
) {
  const statements = [
    `ALTER TABLE ${quoteIdent(physicalName)} ADD COLUMN ${columnDefinition(column, targets)}`,
  ];

  const kind = indexKind(column);
  if (kind) statements.push(buildCreateIndex(physicalName, toColumnName(column.name), kind));

  return statements;
}

export const buildDropTable = (physicalName: string) => `DROP TABLE ${quoteIdent(physicalName)}`;
