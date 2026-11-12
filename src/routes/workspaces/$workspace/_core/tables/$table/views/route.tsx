import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/views")({
  staticData: { crumb: "Views" },
  component: Outlet,
});
