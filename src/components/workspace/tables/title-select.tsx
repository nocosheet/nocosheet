import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

export type TitleOption = { value: string; label: string };

export function TitleSelect({
  options,
  value,
  onValueChange,
}: {
  options: TitleOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
}) {
  return (
    <Field>
      <FieldLabel>Title column</FieldLabel>
      <Combobox
        items={options}
        value={options.find((option) => option.value === value) ?? null}
        onValueChange={(option) => onValueChange(option?.value ?? null)}
      >
        <ComboboxInput placeholder="Use id" showClear />
        <ComboboxPopup>
          <ComboboxEmpty>No matching columns</ComboboxEmpty>
          <ComboboxList>
            {(option: TitleOption) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
      <FieldDescription>
        Names each record and is shown when other tables link here. Without one, records are shown
        by id.
      </FieldDescription>
    </Field>
  );
}
