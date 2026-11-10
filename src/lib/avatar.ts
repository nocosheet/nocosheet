export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export const avatarKey = (userId: string) => `avatars/${userId}`;

export const avatarUrl = (userId: string, version: number) =>
  `/api/avatar?id=${userId}&v=${version}`;

export const isAvatarUrl = (url: string | null | undefined) =>
  Boolean(url?.startsWith("/api/avatar?"));
