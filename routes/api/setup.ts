import { defineHandler } from "void";
import { z } from "zod";

import { hasUsers } from "@/lib/auth/repository";
import { httpError } from "@/lib/http";

const bodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  password: z.string().min(8),
});

export const GET = defineHandler(async () => ({ needsSetup: !(await hasUsers()) }));

export const POST = defineHandler(async (c) => {
  if (await hasUsers()) throw httpError(409, "Setup is already complete.");

  const parsed = bodySchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw httpError(400, "Invalid name, email or password.");
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
