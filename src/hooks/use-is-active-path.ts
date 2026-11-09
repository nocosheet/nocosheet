import { useLocation } from "@tanstack/react-router";

/** `isActive("/account")` matches the page and its children; pass `exact` for index-style routes. */
export function useIsActivePath() {
  const pathname = useLocation({ select: (location) => location.pathname });

  return (to: string, exact = false) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
}
