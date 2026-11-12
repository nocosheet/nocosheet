export function isSafeExpression(expression: string) {
  let depth = 0;
  let quote: "'" | '"' | null = null;

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if (quote) {
      if (char === quote) {
        if (expression[i + 1] === quote) i++;
        else quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"') quote = char;
    else if (char === "(") depth++;
    else if (char === ")" && --depth < 0) return false;
    else if (char === ";" || char === "`" || char === "[" || char === "]") return false;
    else if (char === "-" && expression[i + 1] === "-") return false;
    else if (char === "/" && expression[i + 1] === "*") return false;
  }

  return quote === null && depth === 0 && expression.trim().length > 0;
}

export class ExpressionError extends Error {}

export function compileExpression(expression: string, columns: Map<string, string>) {
  let sql = "";
  let stored = "";
  let quote: "'" | '"' | null = null;

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if (quote) {
      sql += char;
      stored += char;
      if (char === quote) {
        if (expression[i + 1] === quote) {
          sql += quote;
          stored += quote;
          i++;
        } else quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
    } else if (char === "{") {
      const end = expression.indexOf("}", i);
      if (end === -1) throw new ExpressionError("Close every { with a }");
      const name = expression.slice(i + 1, end).trim();
      const key = columns.get(name.toLowerCase());
      if (!key) throw new ExpressionError(`"${name}" isn't a column of this table`);
      sql += `"${key}"`;
      stored += `{${key}}`;
      i = end;
      continue;
    }

    sql += char;
    stored += char;
  }

  return { sql, stored };
}
