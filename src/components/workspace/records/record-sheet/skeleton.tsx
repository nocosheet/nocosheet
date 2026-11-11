import { Alert, AlertDescription } from "@/components/ui/alert";
import { SheetDescription, SheetHeader, SheetPanel, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

export function RecordSheetSkeleton({
  title,
  tableName,
  error,
}: {
  title: string;
  tableName: string;
  error?: Error | null;
}) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>{tableName}</SheetDescription>
      </SheetHeader>
      <SheetPanel>
        {error ? (
          <Alert variant="error">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        )}
      </SheetPanel>
    </>
  );
}
