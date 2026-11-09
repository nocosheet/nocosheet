import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

type BackupCodesDialogProps = {
  open: boolean;
  codes: string[];
  onDone: () => void;
};

export function BackupCodesDialog({ open, codes, onDone }: BackupCodesDialogProps) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const text = codes.join("\n");

  function download() {
    const url = URL.createObjectURL(new Blob([`${text}\n`], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "nocosheet-backup-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    // Closing without "Done" is blocked on purpose: codes are only shown once.
    <Dialog open={open} onOpenChange={(next) => !next && onDone()}>
      <DialogPopup showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Save your backup codes</DialogTitle>
          <DialogDescription>
            Each code works once if you lose access to your authenticator app. Store them somewhere
            safe. You won't be able to see them again.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <ul className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/50 p-4 font-mono text-sm">
            {codes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
        </DialogPanel>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => copyToClipboard(text)}>
            {isCopied ? <CheckIcon /> : <CopyIcon />}
            {isCopied ? "Copied" : "Copy"}
          </Button>
          <Button type="button" variant="outline" onClick={download}>
            <DownloadIcon />
            Download
          </Button>
          <Button type="button" onClick={onDone}>
            Done
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
