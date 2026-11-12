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
