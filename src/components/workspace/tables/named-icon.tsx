import { TableIcon } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";

export function NamedIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  if (!name) return <TableIcon className={className} />;
  return (
    <DynamicIcon
      name={name as IconName}
      className={className}
      fallback={() => <span className={className} />}
    />
  );
}
