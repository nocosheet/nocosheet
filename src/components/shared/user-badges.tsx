import { Badge } from "@/components/ui/badge";
import { isAdmin } from "@/lib/auth/access";

export function RoleBadge({ user }: { user: { role?: string | null } }) {
  return isAdmin(user) ? (
    <Badge variant="info" size="sm">
      Admin
    </Badge>
  ) : (
    <Badge variant="secondary" size="sm">
      User
    </Badge>
  );
}
