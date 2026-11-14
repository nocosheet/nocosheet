import {
  type inferParserType,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { z } from "zod";

import type { FilterCondition } from "./filters";

export const RECORD_PAGE_SIZES = [10, 25, 50, 100] as const;

export const toBase64Url = (text: string) => {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
};

export const fromBase64Url = (value: string) => {
  const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
};

export const recordsSearchParams = {
  pageSize: parseAsNumberLiteral(RECORD_PAGE_SIZES).withDefault(25),
  sort: parseAsString,
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc"),
  q: parseAsString.withDefault(""),
  filter: parseAsString.withDefault(""),
};

export type RecordsQuery = inferParserType<typeof recordsSearchParams>;

export const resolveRecordsQuery = (
  search: Partial<RecordsQuery> & { cursor?: string | null },
) => ({
  cursor: search.cursor ?? null,
  pageSize: search.pageSize ?? recordsSearchParams.pageSize.defaultValue,
  sort: search.sort ?? null,
  order: search.order ?? recordsSearchParams.order.defaultValue,
  q: search.q ?? recordsSearchParams.q.defaultValue,
  filter: search.filter ?? "",
});

export type ResolvedRecordsQuery = ReturnType<typeof resolveRecordsQuery>;

export const recordsKeyOf = (query: ResolvedRecordsQuery) => ({
  cursor: query.cursor,
  pageSize: query.pageSize,
  sort: query.sort,
  order: query.order,
  q: query.q,
  filter: query.filter,
});

export type TypedRecordsQuery = Omit<ResolvedRecordsQuery, "filter"> & {
  filters: FilterCondition[];
};

export function withFilters(
  query: ResolvedRecordsQuery,
  filters: FilterCondition[],
): TypedRecordsQuery {
  const { filter: _wire, ...rest } = query;
  return { ...rest, filters };
}

export const validateRecordsSearch = (search: Record<string, unknown>): Partial<RecordsQuery> => {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(recordsSearchParams) as (keyof RecordsQuery)[]) {
    const raw = search[key];
    const text =
      typeof raw === "string" || typeof raw === "number"
        ? String(raw)
        : raw && typeof raw === "object"
          ? JSON.stringify(raw)
          : undefined;
    if (text === undefined) continue;
    const parsed = recordsSearchParams[key].parseServerSide(text);
    if (parsed !== null) result[key] = parsed;
  }
  return result;
};

export const recordsApiSchema = z.object({
  cursor: z.string().max(1024).optional(),
  pageSize: z.coerce
    .number()
    .pipe(z.union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)]))
    .optional(),
  sort: z.string().max(64).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  q: z.string().max(100).optional(),
  filter: z.string().max(2000).optional(),
});

export const recordsDeleteSchema = z.object({
  ids: z
    .array(z.union([z.number().int(), z.string().min(1).max(64)]))
    .min(1)
    .max(100),
});
