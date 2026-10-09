import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ExpandMore from "@mui/icons-material/ExpandMore";
import MenuBook from "@mui/icons-material/MenuBook";
import Groups from "@mui/icons-material/Groups";
import { publicFetchStrict } from "@/lib/server-api";
import type { CourseDetailResponse } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import CoverImage from "@/components/ui/CoverImage";
import LinkButton from "@/components/ui/LinkButton";
import CourseActions from "@/components/courses/CourseActions";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

async function load(slug: string) {
  return publicFetchStrict<CourseDetailResponse>(`/courses/${slug}`, {}, 60);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await load(slug);
  const c = data?.course;
  if (!c) return { title: "Course" };
  return {
    title: c.title,
    description: c.description.slice(0, 160),
    alternates: { canonical: `/courses/${c.slug}` },
    openGraph: { title: c.title, description: c.description.slice(0, 160), images: c.thumbnailUrl ? [c.thumbnailUrl] : undefined },
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, error } = await load(slug);

  if (error) {
    return (
      <div className={`${wrap} py-24`}>
        <div role="alert" className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="font-display text-xl font-bold text-ink-900">We couldn&apos;t load this course</h1>
          <p className="mt-2 text-ink-600">There was a problem reaching the server. Please try again.</p>
          <div className="mt-6 flex justify-center gap-3">
            <LinkButton href={`/courses/${slug}`}>Try again</LinkButton>
            <LinkButton href="/courses" variant="secondary">
              Back to courses
            </LinkButton>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.course) notFound();
  const course = data.course;
  const lessonsTotal = course.chapters.reduce(
    (sum, ch) => sum + ch.topics.reduce((s, t) => s + t._count.lessons, 0),
    0,
  );

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className={`${wrap} py-8 sm:py-12`}>
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-600">
              <li>
                <Link href="/" className="hover:text-ink-900">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-slate-400">
                <ChevronRight fontSize="small" />
              </li>
              <li>
                <Link href="/courses" className="hover:text-ink-900">
                  Courses
                </Link>
              </li>
              <li aria-hidden className="text-slate-400">
                <ChevronRight fontSize="small" />
              </li>
              <li className="font-medium text-ink-900" aria-current="page">
                {course.title}
              </li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <Badge tone="brand">{course.category}</Badge>
              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                {course.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-ink-600">{course.description}</p>
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                {course.gradeLevel && (
                  <div>
                    <dt className="text-slate-500">Grade level</dt>
                    <dd className="font-semibold text-ink-900">{course.gradeLevel}</dd>
                  </div>
                )}
                {lessonsTotal > 0 && (
                  <div>
                    <dt className="text-slate-500">Lessons</dt>
                    <dd className="font-semibold text-ink-900">{lessonsTotal}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-elev2">
              <div className="aspect-[16/10] w-full bg-slate-100">
                <CoverImage src={course.thumbnailUrl} alt={`Cover image for ${course.title}`} fallback={course.category} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className={`${wrap} grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16`}>
        <div className="min-w-0">
          {/* Overview */}
          <section aria-labelledby="overview-heading">
            <h2 id="overview-heading" className="font-display text-2xl font-bold text-ink-900">
              About this course
            </h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-700">
              {course.roadmapSummary?.trim() || course.description}
            </p>
          </section>

          {/* Curriculum */}
          <section aria-labelledby="curriculum-heading" className="mt-12">
            <h2 id="curriculum-heading" className="font-display text-2xl font-bold text-ink-900">
              Curriculum
            </h2>
            {course.chapters.length > 0 ? (
              <ol className="mt-6 space-y-3">
                {course.chapters.map((ch, index) => (
                  <li key={ch.id}>
                    <details className="group rounded-2xl border border-slate-200" open={index === 0}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40">
                        <span className="flex items-center gap-3">
                          <MenuBook fontSize="small" className="text-brand-700" />
                          <span className="font-semibold text-ink-900">
                            {ch.title}
                            {ch.summary && <span className="ml-2 font-normal text-ink-600">{ch.summary}</span>}
                          </span>
                        </span>
                        <ExpandMore
                          fontSize="small"
                          className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                        />
                      </summary>
                      <ul className="border-t border-slate-100 px-5 py-3">
                        {ch.topics.length > 0 ? (
                          ch.topics.map((t) => (
                            <li
                              key={t.id}
                              className="flex items-center justify-between gap-4 py-2 text-sm text-ink-700"
                            >
                              <span>{t.title}</span>
                              <span className="shrink-0 text-slate-500">
                                {t._count.lessons} {t._count.lessons === 1 ? "lesson" : "lessons"}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="py-2 text-sm text-slate-500">Topics are being added.</li>
                        )}
                      </ul>
                    </details>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-ink-600">
                The curriculum for this course is being finalised.
              </p>
            )}
          </section>

          {/* Mentors */}
          <section aria-labelledby="mentors-heading" className="mt-12">
            <h2 id="mentors-heading" className="font-display text-2xl font-bold text-ink-900">
              Mentors
            </h2>
            {course.mentors.length > 0 ? (
              <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                {course.mentors.map((m) => (
                  <li key={m.user.id} className="flex gap-4 rounded-2xl border border-slate-200 p-5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-100">
                      <CoverImage
                        src={m.user.avatarUrl}
                        alt=""
                        fallback={`${m.user.firstName[0] ?? ""}${m.user.lastName[0] ?? ""}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900">
                        {m.user.firstName} {m.user.lastName}
                      </p>
                      <p className="text-sm text-brand-700">Course mentor</p>
                      {m.user.bio && <p className="mt-2 text-sm leading-relaxed text-ink-600">{m.user.bio}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-ink-600">
                <Groups fontSize="small" className="mr-2 align-text-bottom text-slate-400" />
                Mentors for this course are being assigned.
              </p>
            )}
          </section>
        </div>

        {/* Enrolment panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <CourseActions
            courseId={course.id}
            slug={course.slug}
            pricePaise={course.pricePaise}
            currency={course.currency}
          />
          <p className="mt-4 text-center text-xs text-slate-500">
            Learning content unlocks only after confirmed enrolment.
          </p>
          <div className="mt-6 flex flex-col gap-2 text-sm">
            <Link href="/courses" className="font-semibold text-brand-700 hover:text-brand-800">
              ← Back to all courses
            </Link>
            <Link href="/contact" className="text-ink-600 hover:text-ink-900">
              Questions? Contact us
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
