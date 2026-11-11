import type { Column } from "../tables/repository";
import { findBrokenLink } from "./repository";
import type { ParsedValue } from "./values";

export async function checkLinks(workspace: string, parsed: ParsedValue<Column>[]) {
  const broken = await findBrokenLink(workspace, parsed);
  if (!broken) return undefined;
  return {
    field: broken.column.columnName,
    message:
      broken.reason === "table"
        ? `${broken.column.name}: the linked table no longer exists.`
        : `${broken.column.name}: the linked record no longer exists. Refresh and pick again.`,
  };
}
