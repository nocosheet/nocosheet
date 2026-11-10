import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/w/$workspace/_app/tables/$table/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/w/$workspace/tables/$table/definition", params });
  },
});
