import { useCallback, useState } from "react";

export function useGroupCollapse() {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  const toggle = useCallback(
    (key: string) =>
      setCollapsed((current) => {
        const next = new Set(current);
        if (!next.delete(key)) next.add(key);
        return next;
      }),
    [],
  );
  const reset = useCallback(() => setCollapsed(new Set()), []);

  return { collapsed, toggle, reset };
}
