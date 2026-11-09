export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  sessions: () => [...authKeys.all, "sessions"] as const,
  accounts: () => [...authKeys.all, "accounts"] as const,
  setupStatus: () => [...authKeys.all, "setup-status"] as const,
  passkeys: () => [...authKeys.all, "passkeys"] as const,
  mutation: (name: string) => [...authKeys.all, name] as const,
};
