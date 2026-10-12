import LinkButton from "@/components/ui/LinkButton";

export default function DataUnavailable({ label }: { label: string }) {
  return (
    <div className="max-w-3xl rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-8 sm:p-12">
      <h2 className="font-display text-xl font-bold text-ink-900">We couldn&apos;t load {label} right now</h2>
      <p className="mt-3 leading-relaxed text-ink-600">
        Something went wrong on our side — this isn&apos;t an empty page. Please try again shortly, or reach
        out and we&apos;ll help directly.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <LinkButton href="/contact" variant="secondary">
          Contact us
        </LinkButton>
      </div>
    </div>
  );
}
