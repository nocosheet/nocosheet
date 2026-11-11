import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/w/$workspace/_app/tables/$table/_viewer/")({
  component: () => null,
});
