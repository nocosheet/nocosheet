import { TableIcon, type LucideIcon } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";

export function NamedIcon({
  name,
  className,
  fallback: Fallback = TableIcon,
}: {
  name: string | null | undefined;
  className?: string;
  fallback?: LucideIcon;
}) {
  if (!name) return <Fallback className={className} />;
  return (
    <DynamicIcon
      name={name as IconName}
      className={className}
      fallback={() => <Fallback className={className} />}
    />
  );
}
