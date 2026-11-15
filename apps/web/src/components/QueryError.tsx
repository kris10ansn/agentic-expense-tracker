import { Button } from "./inputs";

export function QueryError({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div role="alert" className="my-3 text-sm text-red-700">
      <p>{message}</p>
      <Button
        variant="ghost"
        className="mt-1 px-2 text-red-700 hover:bg-red-50"
        onClick={onRetry}
        disabled={retrying}
      >
        {retrying ? "Retrying…" : "Try again"}
      </Button>
    </div>
  );
}
