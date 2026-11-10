import { FetchError } from "void/client";

export async function unwrapFetch<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof FetchError) {
      const data = error.data as { error?: string; message?: string } | undefined;
      throw new Error(data?.error ?? data?.message ?? error.message);
    }
    throw error;
  }
}
