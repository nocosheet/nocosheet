import { useRef, useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { FileIcon, UploadIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { uploadFileMutationOptions } from "@/data/workspace/records";
import {
  asFiles,
  FILE_MAX_BYTES,
  FILE_MAX_COUNT,
  formatBytes,
  isImageType,
  type FileValue,
} from "@/lib/files";
import type { FormValue } from "@/lib/records/form";

import type { ViewerColumn } from "./columns";

export function FileThumb({ file, className }: { file: FileValue; className?: string }) {
  return isImageType(file.type) ? (
    <img src={file.url} alt={file.name} loading="lazy" className={className} />
  ) : (
    <span className={className}>
      <FileIcon className="size-4 text-muted-foreground" />
    </span>
  );
}

export function FileInput({
  id,
  workspace,
  tableId,
  column,
  value,
  disabled,
  onChange,
  onBlur,
}: {
  id: string;
  workspace: string;
  tableId: number;
  column: ViewerColumn;
  value: FormValue;
  disabled: boolean;
  onChange: (value: FormValue) => void;
  onBlur: () => void;
}) {
  const files = asFiles(value);
  const multiple = column.options.multiple === true;
  const max = multiple ? FILE_MAX_COUNT : 1;
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const upload = useMutation(uploadFileMutationOptions);

  const pick = async (picked: File[]) => {
    setError(null);
    let next = files;
    for (const file of picked.slice(0, Math.max(0, max - files.length) || 1)) {
      if (file.size > FILE_MAX_BYTES) {
        setError(`${file.name} is larger than ${formatBytes(FILE_MAX_BYTES)}.`);
        continue;
      }
      if (column.format === "image" && !isImageType(file.type)) {
        setError(`${file.name} isn't an image.`);
        continue;
      }
      try {
        const uploaded = await upload.mutateAsync({
          workspace,
          tableId,
          column: column.key,
          file,
        });
        next = multiple ? [...next, uploaded] : [uploaded];
        onChange(next);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The upload failed.");
      }
    }
    onBlur();
  };

  const remove = (index: number) => {
    onChange(files.filter((_, position) => position !== index));
    onBlur();
  };

  const full = !multiple && files.length >= 1;

  return (
    <div className="flex w-full flex-col gap-2">
      {files.length > 0 && (
        <ul className="flex w-full flex-col gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.url}-${index}`}
              className="flex items-center gap-3 rounded-lg border p-2"
            >
              <FileThumb
                file={file}
                className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted object-cover"
              />
              <div className="min-w-0 flex-1">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {file.name}
                </a>
                <p className="text-muted-foreground text-xs">{formatBytes(file.size)}</p>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => remove(index)}
                >
                  <XIcon />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!disabled && (
        <>
          <input
            ref={inputRef}
            id={id}
            type="file"
            className="sr-only"
            multiple={multiple}
            accept={column.format === "image" ? "image/*" : undefined}
            onChange={(event) => {
              const picked = Array.from(event.target.files ?? []);
              event.target.value = "";
              void pick(picked);
            }}
          />
          {!full && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              loading={upload.isPending}
              disabled={files.length >= max}
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon />
              {column.format === "image" ? "Upload image" : "Upload file"}
            </Button>
          )}
          {error && <p className="text-destructive-foreground text-xs">{error}</p>}
        </>
      )}
      {disabled && files.length === 0 && <span className="text-muted-foreground">No files</span>}
    </div>
  );
}
