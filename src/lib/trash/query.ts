import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import { PAGE_SIZES } from "../tables/query";

export const TRASH_SORTS = ["name", "deletedAt"] as const;

export const trashSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsNumberLiteral(PAGE_SIZES).withDefault(10),
  sort: parseAsStringLiteral(TRASH_SORTS).withDefault("deletedAt"),
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
  q: parseAsString.withDefault(""),
};

export type TrashQuery = inferParserType<typeof trashSearchParams>;

export const trashSearchSchema = createStandardSchemaV1(trashSearchParams, {
  partialOutput: true,
});

export const resolveTrashQuery = (search: Partial<TrashQuery>): TrashQuery => ({
  page: Math.max(1, search.page ?? trashSearchParams.page.defaultValue),
  pageSize: search.pageSize ?? trashSearchParams.pageSize.defaultValue,
  sort: search.sort ?? trashSearchParams.sort.defaultValue,
  order: search.order ?? trashSearchParams.order.defaultValue,
  q: search.q ?? trashSearchParams.q.defaultValue,
});

export const TRASH_LIST_LIMIT = 200;
