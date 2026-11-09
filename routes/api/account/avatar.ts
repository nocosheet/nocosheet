import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { storage } from "void/storage";

import {
  AVATAR_KEY_PREFIX,
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  AVATAR_URL_PREFIX,
  avatarKeyFromUrl,
} from "@/lib/avatar";

/** Only ever touch keys that belong to the signed-in user. */
function ownedKey(userId: string, image: string | null | undefined) {
  const key = avatarKeyFromUrl(image);
  return key?.startsWith(`${AVATAR_KEY_PREFIX}${userId}-`) ? key : null;
}

export const POST = defineHandler(async (c) => {
  const user = requireAuth(c);
  const form = await c.req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) return c.json({ error: "Missing file" }, 400);
  const extension = AVATAR_TYPES[file.type];
  if (!extension) return c.json({ error: "Use a PNG, JPEG, WebP or GIF image" }, 415);
  if (file.size > AVATAR_MAX_BYTES) return c.json({ error: "Image must be 2 MB or smaller" }, 413);

  const name = `${user.id}-${crypto.randomUUID()}.${extension}`;
  await storage.put(`${AVATAR_KEY_PREFIX}${name}`, file, {
    httpMetadata: { contentType: file.type },
  });

  const previous = ownedKey(user.id, user.image);
  if (previous) await storage.delete(previous);

  return c.json({ url: `${AVATAR_URL_PREFIX}${name}` });
});

export const DELETE = defineHandler(async (c) => {
  const user = requireAuth(c);
  const key = ownedKey(user.id, user.image);
  if (key) await storage.delete(key);
  return c.json({ ok: true });
});
