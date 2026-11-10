import { FlagIcon } from "lucide-react";

import { FrameFooter, FramePanel } from "@/components/ui/frame";

import { WizardSteps } from "./wizard-steps";

export function WizardPanel({
  step,
  title,
  description,
  action,
  children,
}: {
  step: 1 | 2;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <FramePanel className="p-0">
      <WizardSteps step={step} />
      <div className="flex flex-col gap-6 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-base">{title}</h2>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          {action}
        </div>
        {children}
      </div>
    </FramePanel>
  );
}

export function WizardFooter({ hint, children }: { hint: string; children: React.ReactNode }) {
  return (
    <FrameFooter className="flex items-center justify-between gap-4 px-3 py-3">
      <p className="hidden items-center gap-2 text-muted-foreground text-sm sm:flex">
        <FlagIcon className="size-4" />
        {hint}
      </p>
      <div className="ms-auto flex items-center gap-2">{children}</div>
    </FrameFooter>
  );
}
