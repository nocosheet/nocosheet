type AuthResult<T> = {
  data: T | null;
  error: { message?: string; code?: string; status: number; statusText: string } | null;
};

export class AuthError extends Error {
  code?: string;
  status: number;

  constructor(error: NonNullable<AuthResult<unknown>["error"]>) {
    super(error.message || error.statusText || "Something went wrong");
    this.name = "AuthError";
    this.code = error.code;
    this.status = error.status;
  }
}

/** Better Auth client resolves `{ data, error }`; throw so TanStack Query sees failures. */
export function unwrapAuthResult<T>(result: AuthResult<T>): T {
  if (result.error) throw new AuthError(result.error);
  return result.data as T;
}
