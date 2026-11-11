import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/w/$workspace/_core/tables/$table/_viewer/")({
  component: () => null,
});
