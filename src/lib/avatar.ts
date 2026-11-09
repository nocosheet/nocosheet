export const AVATAR_URL_PREFIX = "/api/avatars/";
export const AVATAR_KEY_PREFIX = "avatars/";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Maps an avatar URL we issued back to its R2 key; null for external or missing URLs. */
export function avatarKeyFromUrl(url: string | null | undefined) {
  if (!url?.startsWith(AVATAR_URL_PREFIX)) return null;
  return `${AVATAR_KEY_PREFIX}${url.slice(AVATAR_URL_PREFIX.length)}`;
}
