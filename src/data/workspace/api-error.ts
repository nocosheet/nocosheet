import { FetchError } from "void/client";

export async function unwrapFetch<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof FetchError) {
      const data = error.data as string | { error?: string; message?: string } | undefined;
      if (typeof data === "string" && data.trim()) throw new Error(data);
      if (typeof data === "object") throw new Error(data?.error ?? data?.message ?? error.message);
    }
    throw error;
  }
}
