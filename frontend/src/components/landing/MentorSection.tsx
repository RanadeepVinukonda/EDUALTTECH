import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { buttonClass } from "@/components/ui/Button";

export default function MentorSection() {
  return (
    <section className="border-t border-rule bg-paper-2 py-16 sm:py-20">
      <div className="container grid items-end gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h2 className="max-w-2xl font-display text-section font-semibold text-ink">
            Teach what you know.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">
            Share practical skills, guide learners through structured courses, and earn through teaching.
          </p>
        </div>
        <div className="lg:col-span-4 lg:justify-self-end">
          <Link href="/mentor" className={buttonClass("primary", "lg")}>
            Explore mentoring
            <ArrowForward fontSize="small" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
