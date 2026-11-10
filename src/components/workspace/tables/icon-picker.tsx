import { useMemo, useState } from "react";

import { SearchIcon } from "lucide-react";
import { iconNames } from "lucide-react/dynamic";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { SUGGESTED_ICONS } from "@/lib/tables/icons";
import { cn } from "@/lib/utils";

import { NamedIcon } from "./named-icon";

const MAX_RESULTS = 72;

function search(query: string) {
  const term = query.trim().toLowerCase().replaceAll(/\s+/g, "-");
  if (!term) return SUGGESTED_ICONS;
  const matches = iconNames.filter((name) => name.includes(term));
  matches.sort((a, b) => Number(b.startsWith(term)) - Number(a.startsWith(term)));
  return matches.slice(0, MAX_RESULTS);
}

export function IconPicker({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (value: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = useMemo(() => search(query), [query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger render={<Button variant="outline" size="icon" aria-label={label} />}>
        <NamedIcon name={value} />
      </PopoverTrigger>
      <PopoverPopup align="start" className="w-80">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute start-2.5 z-10 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              type="search"
              autoComplete="off"
              placeholder="Search icons"
              className="ps-8"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {results.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">No icons found</p>
          ) : (
            <div className="grid max-h-56 grid-cols-6 gap-1 overflow-y-auto">
              {results.map((name) => (
                <Button
                  key={name}
                  type="button"
                  variant="ghost"
                  size="icon"
                  title={name}
                  aria-label={name}
                  aria-pressed={name === value}
                  className={cn(name === value && "bg-accent")}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <NamedIcon name={name} />
                </Button>
              ))}
            </div>
          )}
        </div>
      </PopoverPopup>
    </Popover>
  );
}
