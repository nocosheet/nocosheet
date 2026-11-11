import { FetchError } from "void/client";

export class ApiError extends Error {
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

export async function unwrapFetch<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof FetchError) {
      const data = error.data as
        | string
        | { error?: string; message?: string; field?: string }
        | undefined;
      if (typeof data === "string" && data.trim()) throw new Error(data);
      if (typeof data === "object")
        throw new ApiError(data?.error ?? data?.message ?? error.message, data?.field);
    }
    throw error;
  }
}
