import { PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SelectChoice } from "@/lib/tables/formats";
import { toSlug } from "@/lib/tables/naming";

export function ChoicesEditor({
  choices,
  onChange,
}: {
  choices: SelectChoice[];
  onChange: (choices: SelectChoice[]) => void;
}) {
  const update = (index: number, label: string) =>
    onChange(choices.map((choice, i) => (i === index ? { label, value: toSlug(label) } : choice)));

  return (
    <div className="flex flex-col gap-2">
      {choices.map((choice, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            aria-label={`Choice ${index + 1}`}
            placeholder="Choice"
            value={choice.label}
            onChange={(event) => update(index, event.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove choice"
            onClick={() => onChange(choices.filter((_, i) => i !== index))}
          >
            <XIcon />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...choices, { label: "", value: "" }])}
      >
        <PlusIcon />
        Add choice
      </Button>
    </div>
  );
}
