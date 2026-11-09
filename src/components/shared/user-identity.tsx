import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/initials";

export function UserIdentity({
  user,
}: {
  user: { name: string; email: string; image?: string | null };
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-8">
        {user.image && <AvatarImage src={user.image} alt="" />}
        <AvatarFallback>{getInitials(user.name) || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-sm">{user.name}</span>
        <span className="truncate text-muted-foreground text-xs">{user.email}</span>
      </div>
    </div>
  );
}
