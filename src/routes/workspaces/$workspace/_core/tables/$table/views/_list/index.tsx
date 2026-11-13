import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/views/_list/")({
  component: () => null,
});
