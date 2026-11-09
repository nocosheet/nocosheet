export const workspaceKeys = {
  all: ["workspace"] as const,
  members: () => [...workspaceKeys.all, "members"] as const,
};
