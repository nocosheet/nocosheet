import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/w/$workspace/_core/tables")({
  staticData: { crumb: "Tables" },
  component: Outlet,
});
