import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables")({
  staticData: { crumb: "Tables" },
  component: Outlet,
});
