import { defineSeed } from "void/seed";

import { tables } from "./seed/data";
import { seedTable, type SeedState } from "./seed/helpers";
import { SEED_PASSWORD, seedUsers, stableId } from "./seed/users";

export default defineSeed<typeof import("./schema")>(async (context) => {
  if (context.dialect !== "sqlite")
    throw new Error("The workspace seed targets Cloudflare D1 (SQLite).");

  const { db, schema } = context;

  console.log("Seeding users");
  const team = tables.find((table) => table.name === "Team Members");
  if (!team) throw new Error("The seed needs a Team Members table.");
  const users = await seedUsers(db, team.rows);

  console.log("Seeding the default workspace");
  const state: SeedState = new Map();
  for (const [position, table] of tables.entries()) {
    await seedTable(db, schema, state, table, position, users);
  }

  const tableId = (name: string) => {
    const seeded = state.get(name);
    if (!seeded) throw new Error(`Unknown seeded table ${name}`);
    return seeded.id;
  };

  await db.insert(schema.favoriteTable).values([
    { userId: users.admin, tableId: tableId("Tasks") },
    { userId: users.admin, tableId: tableId("Projects") },
    { userId: users.admin, tableId: tableId("Invoices") },
    { userId: users.member, tableId: tableId("Tasks") },
    { userId: users.member, tableId: tableId("Bug Reports") },
  ]);

  const roles = await db.select().from(schema.roleTable);
  const roleId = (name: string) => {
    const role = roles.find((item) => item.name === name);
    if (!role) throw new Error(`Unknown role ${name}`);
    return role.id;
  };
  await db.insert(schema.roleMemberTable).values([
    {
      userId: stableId("user:maya.chen@example.com"),
      roleId: roleId("Editor"),
      assignedBy: users.admin,
    },
    {
      userId: stableId("user:kai.morgan@example.com"),
      roleId: roleId("Contributor"),
      assignedBy: users.admin,
    },
  ]);

  console.log(
    `Done. Sign in as admin@example.com, member@example.com or any team member, e.g. maya.chen@example.com (password: ${SEED_PASSWORD}).`,
  );
});
