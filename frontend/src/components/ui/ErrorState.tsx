import Button from "./Button";

export default function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-[20px] border border-red-200 bg-red-50 px-6 py-14 text-center"
    >
      <p className="font-display text-lg font-bold text-red-700">{title}</p>
      {message && <p className="max-w-sm text-sm text-red-600">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
