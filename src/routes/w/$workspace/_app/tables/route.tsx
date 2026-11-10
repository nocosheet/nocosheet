import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/w/$workspace/_app/tables")({
  staticData: { crumb: "Tables" },
  component: Outlet,
});
