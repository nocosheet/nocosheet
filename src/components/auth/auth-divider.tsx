import { Separator } from "@/components/ui/separator";

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-muted-foreground text-xs">
      <Separator className="flex-1" />
      <span>or</span>
      <Separator className="flex-1" />
    </div>
  );
}
