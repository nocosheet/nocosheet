import { HTTPException } from "hono/http-exception";
import { defineHandler } from "void";
import { db, sql } from "void/db";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  password: z.string().min(8),
});

async function hasUsers() {
  try {
    const rows = await db.all<{ count: number }>(sql`SELECT COUNT(*) AS count FROM "user"`);
    return Number(rows[0]?.count ?? 0) > 0;
  } catch {
    return false;
  }
}

export const GET = defineHandler(async () => ({ needsSetup: !(await hasUsers()) }));

export const POST = defineHandler(async (c) => {
  if (await hasUsers()) throw new HTTPException(409, { message: "Setup is already complete." });

  const parsed = bodySchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    throw new HTTPException(400, { message: "Invalid name, email or password." });
  const { name, email, password } = parsed.data;

  const auth = c.get("__voidAuth" as never) as {
    $context: Promise<{
      password: { hash: (password: string) => Promise<string> };
      adapter: {
        create: (args: { model: string; data: Record<string, unknown> }) => Promise<{ id: string }>;
      };
    }>;
  };
  const { adapter, password: hasher } = await auth.$context;

  const now = new Date();
  const user = await adapter.create({
    model: "user",
    data: {
      name,
      email: email.toLowerCase(),
      emailVerified: true,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    },
  });
  await adapter.create({
    model: "account",
    data: {
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: await hasher.hash(password),
      createdAt: now,
      updatedAt: now,
    },
  });
  return c.json({ ok: true }, 201);
});
