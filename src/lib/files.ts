import { z } from "zod";

export const FILE_MAX_BYTES = 10 * 1024 * 1024;
export const FILE_MAX_COUNT = 20;

export const fileKey = (workspace: string, tableId: number, id: string) =>
  `uploads/${workspace}/${tableId}/${id}`;

export const fileUrl = (workspace: string, tableId: number, id: string) =>
  `/api/w/${workspace}/tables/${tableId}/files/${id}`;

const isFileUrl = (url: string) => url.startsWith("/api/w/") || url.startsWith("https://");

export const fileValueSchema = z.object({
  url: z.string().max(2048).refine(isFileUrl, "Invalid file URL"),
  name: z.string().min(1).max(255),
  size: z.number().int().nonnegative(),
  type: z.string().max(255),
});

export type FileValue = z.infer<typeof fileValueSchema>;

export const isImageType = (type: string) => type.startsWith("image/");

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const asFiles = (value: unknown): FileValue[] =>
  Array.isArray(value)
    ? value.filter((item): item is FileValue => Boolean(item) && typeof item === "object")
    : [];
