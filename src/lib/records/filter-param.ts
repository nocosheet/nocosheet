import {
  type FilterCondition,
  type FilterKind,
  filterConditionSchema,
  filterKind,
  operatorInput,
  operatorsFor,
} from "./filters";

export type FilterTarget = { key: string; name: string; kind: FilterKind };

export const targetsOfColumns = (
  columns: { columnName: string; name: string; format: string }[],
): FilterTarget[] =>
  columns.flatMap((column) => {
    const kind = filterKind(column.format);
    return kind ? [{ key: column.columnName, name: column.name, kind }] : [];
  });

export type FilterParseResult =
  | { ok: true; filter: FilterCondition }
  | { ok: false; message: string };

const MAX_FILTERS = 10;

const needsQuotes = (item: string) => /[,;"]/.test(item) || item !== item.trim();

const quote = (text: string) => `"${text.replaceAll('"', '""')}"`;

const quoteValue = (text: string) => (/[;"]/.test(text) || text !== text.trim() ? quote(text) : text);

function unquote(raw: string) {
  if (raw.length < 2 || !raw.startsWith('"') || !raw.endsWith('"')) return raw;
  return raw.slice(1, -1).replaceAll('""', '"');
}

function splitFilters(text: string) {
  const parts: string[] = [];
  let part = "";
  let quoted = false;
  for (const char of text) {
    if (char === '"') quoted = !quoted;
    if (char === ";" && !quoted) {
      parts.push(part);
      part = "";
    } else {
      part += char;
    }
  }
  parts.push(part);
  return parts.map((item) => item.trim()).filter((item) => item !== "");
}

const quoteName = (name: string) =>
  /[:;"]/.test(name) || name !== name.trim() ? quote(name) : name;

const joinList = (items: string[]) =>
  items.map((item) => (needsQuotes(item) ? quote(item) : item)).join(",");

function splitList(raw: string) {
  const items: string[] = [];
  let item = "";
  let quoted = false;
  let wasQuoted = false;

  for (let index = 0; index < raw.length; index++) {
    const char = raw[index];
    if (char === '"') {
      if (quoted && raw[index + 1] === '"') {
        item += char;
        index++;
      } else {
        quoted = !quoted;
        wasQuoted = true;
      }
    } else if (char === "," && !quoted) {
      items.push(wasQuoted ? item : item.trim());
      item = "";
      wasQuoted = false;
    } else {
      item += char;
    }
  }
  if (raw !== "") items.push(wasQuoted ? item : item.trim());
  return items.filter((value) => value !== "");
}

export function serializeCondition({ op, value }: Pick<FilterCondition, "op" | "value">) {
  if (value === undefined) return op;
  return `${op}.${Array.isArray(value) ? joinList(value) : quoteValue(String(value))}`;
}

export function serializeFilters(
  filters: FilterCondition[],
  nameOf: (key: string) => string = (key) => key,
) {
  return filters.map((filter) => serializeFilter(filter, nameOf)).join(";");
}

export function serializeFilter(
  filter: FilterCondition,
  nameOf: (key: string) => string = (key) => key,
) {
  return `${quoteName(nameOf(filter.column))}:${serializeCondition(filter)}`;
}

function splitName(text: string): { name: string; rest: string } | null {
  if (!text.startsWith('"')) {
    const colon = text.indexOf(":");
    return colon <= 0 ? null : { name: text.slice(0, colon), rest: text.slice(colon + 1) };
  }

  let name = "";
  for (let index = 1; index < text.length; index++) {
    if (text[index] !== '"') {
      name += text[index];
    } else if (text[index + 1] === '"') {
      name += '"';
      index++;
    } else {
      return text[index + 1] === ":" && name !== "" ? { name, rest: text.slice(index + 2) } : null;
    }
  }
  return null;
}

export function parseCondition(target: FilterTarget, text: string): FilterParseResult {
  const dot = text.indexOf(".");
  const op = dot === -1 ? text : text.slice(0, dot);
  const rawText = dot === -1 ? null : text.slice(dot + 1);
  const raw = rawText === null ? null : operatorInput(target.kind, op) === "choices" ? rawText : unquote(rawText);
  const { key: column, kind } = target;

  if (!operatorsFor(kind).some((item) => item.value === op))
    return { ok: false, message: `"${op}" can't be used on "${target.name}".` };

  let value: FilterCondition["value"];
  switch (operatorInput(kind, op)) {
    case "none":
      if (raw !== null) return { ok: false, message: `"${op}" takes no value.` };
      break;
    case "number":
      if (!raw || !Number.isFinite(Number(raw)))
        return { ok: false, message: `"${target.name}:${op}" needs a number.` };
      value = Number(raw);
      break;
    case "boolean":
      if (raw !== "true" && raw !== "false")
        return { ok: false, message: `"${target.name}:${op}" needs true or false.` };
      value = raw === "true";
      break;
    case "choices":
      value = splitList(raw ?? "");
      break;
    default:
      value = raw ?? "";
  }

  const parsed = filterConditionSchema.safeParse({ column, op, value });
  return parsed.success
    ? { ok: true, filter: parsed.data }
    : { ok: false, message: `"${target.name}:${text}" isn't a valid filter.` };
}

export function parseFilter(text: string, targets: readonly FilterTarget[]): FilterParseResult {
  const split = splitName(text);
  if (!split) return { ok: false, message: `"${text}" must look like column:operator.value` };

  const wanted = split.name.toLowerCase();
  const target = targets.find((item) => item.name.toLowerCase() === wanted);
  if (!target) return { ok: false, message: `"${split.name}" can't be filtered.` };
  return parseCondition(target, split.rest);
}

export function parseFilters(text: string, targets: readonly FilterTarget[]) {
  const filters: FilterCondition[] = [];
  const errors: string[] = [];
  const parts = splitFilters(text);
  if (parts.length > MAX_FILTERS) errors.push(`Use at most ${MAX_FILTERS} filters.`);
  for (const text of parts.slice(0, MAX_FILTERS)) {
    const result = parseFilter(text, targets);
    if (result.ok) filters.push(result.filter);
    else errors.push(result.message);
  }
  return { filters, errors };
}
