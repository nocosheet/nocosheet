import { env } from "void/env";

/**
 * Nocosheet is self-hosted with a single workspace that every user belongs to, so the workspace
 * slug is a fixed convention rather than data. Routes still take it as `/w/$workspace`.
 */
export const DEFAULT_WORKSPACE = "default";
export const DEFAULT_WORKSPACE_NAME = env.VITE_WORKSPACE_NAME;
