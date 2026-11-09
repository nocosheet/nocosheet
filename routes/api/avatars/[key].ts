import { defineHandler } from "void";
import { storage } from "void/storage";

import { AVATAR_KEY_PREFIX } from "@/lib/avatar";

const KEY_PATTERN = /^[\w-]+\.(png|jpg|webp|gif)$/;

export const GET = defineHandler(async (c) => {
  const key = c.req.param("key");
  if (!key || !KEY_PATTERN.test(key)) return c.notFound();

  const object = await storage.get(`${AVATAR_KEY_PREFIX}${key}`);
  if (!object) return c.notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  // Keys are unique per upload, so the content never changes.
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Disposition", "attachment");

  return new Response(object.body, { headers });
});
