export function AuthHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="flex flex-col gap-1.5 text-center">
      <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </header>
  );
}
