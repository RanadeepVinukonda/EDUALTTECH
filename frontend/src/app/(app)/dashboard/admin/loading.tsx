import Spinner from "@/components/ui/Spinner";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-paper-2 px-4">
      <Spinner label="Loading administration…" />
    </div>
  );
}
