import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function AppHeader() {
  const session = useSession();

  return (
    <header className="sticky top-0 z-10 px-4 pt-3 md:px-6">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-2xl border bg-background/80 ps-4 pe-2 shadow-xs/5 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <Link to="/" aria-label="Nocosheet home">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {session ? (
            <UserMenu user={session.user} />
          ) : (
            <div className="ms-1 flex items-center gap-2">
              <Button variant="ghost" size="sm" render={<Link to="/auth/sign-in" />}>
                Sign in
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
