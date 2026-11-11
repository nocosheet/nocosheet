export const text = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

export const precisionOf = (options: Record<string, unknown>, fallback: number) =>
  typeof options.precision === "number" ? options.precision : fallback;

export const Muted = ({ children }: { children: React.ReactNode }) => (
  <span className="truncate text-muted-foreground">{children}</span>
);

export const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target={href.startsWith("http") ? "_blank" : undefined}
    rel="noreferrer"
    className="truncate text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground"
    onClick={(event) => event.stopPropagation()}
  >
    {children}
  </a>
);
