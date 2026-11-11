import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { storage } from "void/storage";
import { z } from "zod";

import { FILE_MAX_BYTES, fileKey, fileUrl, isImageType } from "@/lib/files";
import { httpError } from "@/lib/http";
import { authorizeAny } from "@/lib/roles/guard";
import { findTable, listColumns } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const POST = defineHandler.withValidator({ params })(async (c, { params }) => {
  await authorizeAny(requireAuth(c), ["update", "create"], params.id);
  const table = await findTable(params.id);
  if (!table) throw httpError(404, "Table not found.");

  const form = await c.req.formData();
  const file = form.get("file");
  const columnName = form.get("column");
  if (!(file instanceof File)) throw httpError(400, "Missing file.");
  if (typeof columnName !== "string") throw httpError(400, "Missing column.");

  const column = (await listColumns(table.id)).find((item) => item.columnName === columnName);
  if (!column || (column.format !== "file" && column.format !== "image"))
    throw httpError(400, "This column doesn't accept files.");
  if (file.size === 0) throw httpError(400, "The file is empty.");
  if (file.size > FILE_MAX_BYTES) throw httpError(400, "Files can be at most 10 MB.");
  if (column.format === "image" && !isImageType(file.type))
    throw httpError(400, "Only images are allowed.");

  const id = crypto.randomUUID();
  const type = file.type || "application/octet-stream";
  await storage.put(fileKey(params.workspace, table.id, id), file, {
    httpMetadata: { contentType: type },
    customMetadata: { name: file.name },
  });

  return { url: fileUrl(params.workspace, table.id, id), name: file.name, size: file.size, type };
});
