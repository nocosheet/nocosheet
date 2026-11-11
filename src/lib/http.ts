import { HTTPException } from "hono/http-exception";

import { classifyDbError } from "./db-errors";

export function httpError(status: 400 | 403 | 404 | 409, message: string, field?: string) {
  return new HTTPException(
    status,
    field ? { res: Response.json({ message, field }, { status }) } : { message },
  );
}

export function conflictOrBadRequest(error: unknown, conflictMessage: string): never {
  const failure = classifyDbError(error);
  if (failure.kind === "unique" || failure.kind === "exists") throw httpError(409, conflictMessage);
  throw httpError(400, failure.message);
}

export function writeFailure(
  error: unknown,
  columns: { columnName: string; name: string }[] = [],
): never {
  const failure = classifyDbError(error);
  switch (failure.kind) {
    case "unique": {
      const column = columns.find((item) => item.columnName === failure.column);
      throw httpError(
        409,
        column
          ? `${column.name}: another record already uses this value.`
          : "Another record already uses this value.",
        column?.columnName,
      );
    }
    case "foreign_key":
      throw httpError(400, "A linked record or user doesn't exist.");
    case "check":
      throw httpError(400, "A value doesn't meet its column's rules.");
    case "not_null":
      throw httpError(400, "A required value is missing.");
    default:
      throw httpError(400, failure.message);
  }
}
