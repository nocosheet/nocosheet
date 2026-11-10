import type { SecondaryStorage } from "better-auth";
import { kv } from "void/kv";

/** Workers KV rejects expiration TTLs below 60 seconds. */
const KV_MIN_TTL_SECONDS = 60;

type Entry = { value: string; expiresAt?: number };

const store = kv.map<Entry>("better-auth");

/**
 * Entries carry their own expiry because KV can't expire anything sooner than 60s,
 * while Better Auth uses shorter TTLs (rate-limit windows, one-time codes).
 */
async function read(key: string) {
  const entry = await store.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) return null;
  return entry;
}

function kvTtl(expiresAt: number | undefined) {
  if (!expiresAt) return undefined;
  return { ttl: Math.max(Math.ceil((expiresAt - Date.now()) / 1000), KV_MIN_TTL_SECONDS) };
}

/** Better Auth secondary storage (sessions, verification data, rate-limit counters) on Workers KV. */
export const kvSecondaryStorage: SecondaryStorage = {
  get: async (key) => (await read(key))?.value ?? null,

  set: async (key, value, ttl) => {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
    await store.put(key, { value, expiresAt }, kvTtl(expiresAt));
  },

  delete: async (key) => {
    await store.delete(key);
  },

  getAndDelete: async (key) => {
    const entry = await read(key);
    if (entry) await store.delete(key);
    return entry?.value ?? null;
  },

  // KV has no atomic operations, so this is a best-effort counter: concurrent requests can
  // under-count, and counts can lag across locations (eventual consistency).
  increment: async (key, ttl) => {
    const entry = await read(key);
    const count = entry ? Number(entry.value) + 1 : 1;
    // The window is fixed from creation: later increments never extend it.
    const expiresAt = entry?.expiresAt ?? Date.now() + ttl * 1000;
    await store.put(key, { value: String(count), expiresAt }, kvTtl(expiresAt));
    return count;
  },
};
