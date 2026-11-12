import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/w/$workspace/_core/tables/$table/view")({
  staticData: { crumb: "Views" },
  component: Outlet,
});
