import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const TABLE_SORTS = ["name", "groupName", "columnCount", "updatedAt"] as const;
export const PAGE_SIZES = [10, 20, 50, 100] as const;

export const tablesSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsNumberLiteral(PAGE_SIZES).withDefault(10),
  sort: parseAsStringLiteral(TABLE_SORTS).withDefault("name"),
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc"),
  q: parseAsString.withDefault(""),
};

export type TablesQuery = inferParserType<typeof tablesSearchParams>;

export const tablesSearchSchema = createStandardSchemaV1(tablesSearchParams, {
  partialOutput: true,
});

export const resolveTablesQuery = (search: Partial<TablesQuery>): TablesQuery => ({
  page: Math.max(1, search.page ?? tablesSearchParams.page.defaultValue),
  pageSize: search.pageSize ?? tablesSearchParams.pageSize.defaultValue,
  sort: search.sort ?? tablesSearchParams.sort.defaultValue,
  order: search.order ?? tablesSearchParams.order.defaultValue,
  q: search.q ?? tablesSearchParams.q.defaultValue,
});

export const validateTablesSearch = (search: Record<string, unknown>): Partial<TablesQuery> => {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(tablesSearchParams) as (keyof TablesQuery)[]) {
    const raw = search[key];
    if (typeof raw !== "string" && typeof raw !== "number") continue;
    const parsed = tablesSearchParams[key].parseServerSide(String(raw));
    if (parsed !== null) result[key] = parsed;
  }
  return result;
};
