import Spinner from "@/components/ui/Spinner";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-paper-2 px-4">
      <Spinner label="Loading your dashboard…" />
    </div>
  );
}
