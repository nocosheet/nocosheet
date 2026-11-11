import { hashPassword } from "better-auth/crypto";
import { createHash } from "node:crypto";

import { accountTable, userTable } from "../../.void/better-auth-schema";
import { at, type SeedDb, type SeedRow } from "./helpers";

export const SEED_PASSWORD = "password123";

export type SeedUsers = { admin: string; member: string; others: string[] };

type Account = {
  name: string;
  email: string;
  role: "admin" | "user";
  joined: Date;
  banned?: boolean;
};

const MEMBERS_WITH_ACCOUNTS = new Set([
  "maya.chen@example.com",
  "kai.morgan@example.com",
  "priya.nair@example.com",
  "diego.alvarez@example.com",
]);

export const stableId = (key: string) =>
  createHash("sha256").update(key).digest("hex").slice(0, 32);

async function createAccount(db: SeedDb, account: Account) {
  const id = stableId(`user:${account.email}`);

  await db.insert(userTable).values({
    id,
    name: account.name,
    email: account.email,
    emailVerified: true,
    role: account.role,
    banned: account.banned ?? false,
    banReason: account.banned ? "No longer with the company" : null,
    createdAt: account.joined,
    updatedAt: account.joined,
  });
  await db.insert(accountTable).values({
    id: stableId(`account:${account.email}`),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: await hashPassword(SEED_PASSWORD),
    createdAt: account.joined,
    updatedAt: account.joined,
  });

  return id;
}

export async function seedUsers(db: SeedDb, team: SeedRow[]): Promise<SeedUsers> {
  const admin = await createAccount(db, {
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    joined: new Date(at(-400)),
  });
  const member = await createAccount(db, {
    name: "Member User",
    email: "member@example.com",
    role: "user",
    joined: new Date(at(-150)),
  });

  const others: string[] = [];
  const people = team.filter((person) => MEMBERS_WITH_ACCOUNTS.has(String(person.Email)));
  for (const person of people) {
    const active = person.Active !== false;
    const id = await createAccount(db, {
      name: String(person.Name),
      email: String(person.Email),
      role: "user",
      joined: new Date(`${String(person.Joined)}T09:00:00Z`),
      banned: !active,
    });
    if (active) others.push(id);
  }

  console.log(`  1 admin, ${1 + others.length} members`);
  return { admin, member, others };
}
