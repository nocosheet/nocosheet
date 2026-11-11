import { defineHandler } from "void";
import { requireAuth } from "void/auth";

import { listSidebarRows } from "@/lib/tables/repository";

export const GET = defineHandler(async (c) => listSidebarRows(requireAuth(c).id));
