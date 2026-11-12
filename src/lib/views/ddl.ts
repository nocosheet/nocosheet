import { quoteIdent } from "../tables/naming";

const SYSTEM_COLUMNS = ["id", "created_at", "updated_at", "created_by", "updated_by"];

export const buildCreateView = (
  viewPhysicalName: string,
  tablePhysicalName: string,
  columnNames: string[],
  where: string | null,
) =>
  `CREATE VIEW ${quoteIdent(viewPhysicalName)} AS SELECT ${[...SYSTEM_COLUMNS, ...columnNames]
    .map((name) => `t.${quoteIdent(name)}`)
    .join(", ")} FROM ${quoteIdent(tablePhysicalName)} t${where ? ` WHERE ${where}` : ""}`;

export const buildDropView = (viewPhysicalName: string) =>
  `DROP VIEW IF EXISTS ${quoteIdent(viewPhysicalName)}`;
