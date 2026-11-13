import { type ReactNode, useState } from "react";

import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";

export function TrashSheet({
  title,
  description,
  onClose,
  children,
  nested,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  nested?: ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetPopup className="max-w-3xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <SheetPanel>{children}</SheetPanel>
        {nested}
      </SheetPopup>
    </Sheet>
  );
}
