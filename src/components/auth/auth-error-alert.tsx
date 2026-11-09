import { Alert, AlertDescription } from "@/components/ui/alert";

export function AuthErrorAlert({ error }: { error: Error | null }) {
  if (!error) return null;

  return (
    <Alert variant="error">
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}
