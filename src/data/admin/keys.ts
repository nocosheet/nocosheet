export const adminKeys = {
  all: ["admin"] as const,
  user: (userId: string) => [...adminKeys.all, "user", userId] as const,
  sessions: (userId: string) => [...adminKeys.all, "sessions", userId] as const,
  mutation: (name: string) => [...adminKeys.all, name] as const,
};
