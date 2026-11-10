import { Spinner } from "@/components/ui/spinner";

export function RoutePending() {
  return (
    <div className="flex min-h-64 flex-1 items-center justify-center">
      <Spinner className="size-5 text-muted-foreground" />
    </div>
  );
}
