import { cn } from "@/lib/utils";

/** Same mark as public/icons.svg, drawn with currentColor so it follows the app theme. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-6", className)}
    >
      <rect x="4" y="4" width="24" height="24" rx="6" />
      <path d="M4 13h24M14 13v15" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold text-lg", className)}>
      <LogoMark />
      Nocosheet
    </span>
  );
}
