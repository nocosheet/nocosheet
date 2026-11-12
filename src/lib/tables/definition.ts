export type ColumnExpressions = { generated: string | null; check: string | null };

const WORD = /[A-Za-z_]/;
const WORD_PART = /[A-Za-z0-9_$]/;

function skipQuoted(text: string, start: number) {
  const quote = text[start];
  const close = quote === "[" ? "]" : quote;
  let i = start + 1;
  while (i < text.length) {
    if (text[i] === close) {
      if (quote !== "[" && text[i + 1] === close) i += 2;
      else return i + 1;
    } else i++;
  }
  return text.length;
}

function skipGroup(text: string, open: number) {
  let depth = 0;
  let i = open;
  while (i < text.length) {
    const char = text[i];
    if (char === "'" || char === '"' || char === "`" || char === "[") {
      i = skipQuoted(text, i);
      continue;
    }
    if (char === "(") depth++;
    else if (char === ")" && --depth === 0) return i;
    i++;
  }
  return text.length;
}

function splitTopLevel(body: string) {
  const parts: string[] = [];
  let start = 0;
  let i = 0;
  while (i < body.length) {
    const char = body[i];
    if (char === "'" || char === '"' || char === "`" || char === "[") {
      i = skipQuoted(body, i);
      continue;
    }
    if (char === "(") {
      i = skipGroup(body, i) + 1;
      continue;
    }
    if (char === ",") {
      parts.push(body.slice(start, i));
      start = i + 1;
    }
    i++;
  }
  parts.push(body.slice(start));
  return parts;
}

function readName(segment: string) {
  const text = segment.trimStart();
  const offset = segment.length - text.length;
  if (text[0] === '"' || text[0] === "`" || text[0] === "[") {
    const end = skipQuoted(text, 0);
    const raw = text.slice(1, end - 1);
    return { name: raw.replaceAll('""', '"'), rest: segment.slice(offset + end) };
  }
  let end = 0;
  while (end < text.length && WORD_PART.test(text[end])) end++;
  return { name: text.slice(0, end), rest: segment.slice(offset + end) };
}

const TABLE_CONSTRAINTS = new Set(["CONSTRAINT", "PRIMARY", "UNIQUE", "CHECK", "FOREIGN"]);

function readClauses(name: string, text: string) {
  const checks: string[] = [];
  let generated: string | null = null;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    if (char === "'" || char === '"' || char === "`" || char === "[") {
      i = skipQuoted(text, i);
      continue;
    }
    if (char === "(") {
      i = skipGroup(text, i) + 1;
      continue;
    }
    if (WORD.test(char)) {
      let end = i + 1;
      while (end < text.length && WORD_PART.test(text[end])) end++;
      const word = text.slice(i, end).toUpperCase();
      const rest = text.slice(end);
      const generatedAt = word === "GENERATED" ? /^\s+ALWAYS\s+AS\s*\(/i.exec(rest) : null;
      const checkAt = word === "CHECK" ? /^\s*\(/.exec(rest) : null;
      const match = generatedAt ?? checkAt;
      if (match) {
        const open = end + match[0].length - 1;
        const close = skipGroup(text, open);
        const inner = text.slice(open + 1, close).trim();
        if (generatedAt) generated = inner;
        else if (!isCheckboxCheck(name, inner)) checks.push(inner);
        i = close + 1;
        continue;
      }
      i = end;
      continue;
    }
    i++;
  }

  return { generated, check: checks.length > 0 ? checks.join(" and ") : null };
}

function isCheckboxCheck(column: string, expression: string) {
  const match = /^\s*(?:"([^"]+)"|(\w+))\s+IN\s*\(\s*0\s*,\s*1\s*\)\s*$/i.exec(expression);
  const target = match?.[1] ?? match?.[2];
  return target !== undefined && target.toLowerCase() === column.toLowerCase();
}

export function parseColumnExpressions(createSql: string | null | undefined) {
  const result = new Map<string, ColumnExpressions>();
  if (!createSql) return result;

  const open = createSql.indexOf("(");
  if (open === -1) return result;
  const close = skipGroup(createSql, open);

  for (const segment of splitTopLevel(createSql.slice(open + 1, close))) {
    const { name, rest } = readName(segment);
    if (!name || TABLE_CONSTRAINTS.has(name.toUpperCase())) continue;
    const { generated, check } = readClauses(name, rest);
    if (generated !== null || check !== null)
      result.set(name.toLowerCase(), { generated, check });
  }

  return result;
}
