import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ExpandMore from "@mui/icons-material/ExpandMore";
import WorkspacePremium from "@mui/icons-material/WorkspacePremium";
import { publicFetchStrict } from "@/lib/server-api";
import { siteUrl } from "@/lib/site";
import type { CourseDetailResponse } from "@/lib/types";
import CoverImage from "@/components/ui/CoverImage";
import FeatureIcon from "@/components/ui/FeatureIcon";
import LinkButton from "@/components/ui/LinkButton";
import TapLoader from "@/components/ui/TapLoader";
import CourseActions from "@/components/courses/CourseActions";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

const TYPE_LABEL: Record<string, string> = {
  EDUCATION: "Education",
  ALTERNATIVE_EDUCATION: "Alternative Education",
};

async function load(slug: string) {
  return publicFetchStrict<CourseDetailResponse>(`/courses/${slug}`, {}, 60);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await load(slug);
  const c = data?.course;
  if (!c) return { title: "Course" };
  const description = c.description.slice(0, 160);
  return {
    title: c.title,
    description,
    alternates: { canonical: `/courses/${c.slug}` },
    openGraph: {
      type: "website",
      siteName: "EduAltTech",
      locale: "en_IN",
      url: `/courses/${c.slug}`,
      title: c.title,
      description,
      images: c.thumbnailUrl ? [c.thumbnailUrl] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: c.title,
      description,
      images: c.thumbnailUrl ? [c.thumbnailUrl] : undefined,
    },
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
  const typeLabel = TYPE_LABEL[course.type] ?? "Course";

  const base = await siteUrl();
  // ponytail: one lesson ≈ one hour; drop courseWorkload if real durations land in the data.
  const workload = lessonsTotal > 0 ? `PT${lessonsTotal}H` : undefined;
  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    url: `${base}/courses/${course.slug}`,
    ...(course.thumbnailUrl ? { image: course.thumbnailUrl } : {}),
    provider: { "@type": "EducationalOrganization", "@id": `${base}/#organization`, name: "EduAltTech" },
    inLanguage: "en-IN",
    offers: {
      "@type": "Offer",
      price: (course.pricePaise / 100).toFixed(2),
      priceCurrency: course.currency,
      category: course.pricePaise === 0 ? "Free" : "Paid",
      availability: "https://schema.org/InStock",
      url: `${base}/courses/${course.slug}`,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      ...(workload ? { courseWorkload: workload } : {}),
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Courses", item: `${base}/courses` },
      { "@type": "ListItem", position: 3, name: course.title, item: `${base}/courses/${course.slug}` },
    ],
  };

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className={`${wrap} pt-6`}>
        <nav aria-label="Breadcrumb">
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
      </div>

      <div className={`${wrap} grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14`}>
        <div className="min-w-0">
          {/* Hero — translucent thumbnail with title + tags on it */}
          <div className="relative flex min-h-[240px] items-end overflow-hidden rounded-[20px] bg-slate-900 shadow-elev2">
            {course.thumbnailUrl && (
              <div className="absolute inset-0">
                <CoverImage src={course.thumbnailUrl} alt="" fallback="" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
            <div className="relative z-10 w-full p-6 text-white sm:p-7">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/80">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-px w-4 bg-white/40" />
                  {typeLabel}
                </span>
                {course.domain && <span className="text-white/60">{course.domain}</span>}
              </div>
              <h1 className="mt-3.5 max-w-[660px] font-display text-2xl font-extrabold tracking-tight sm:text-[27px]">
                {course.title}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-brand-100">
                {course.chapters.length > 0 && (
                  <span>
                    {course.chapters.length} {course.chapters.length === 1 ? "chapter" : "chapters"}
                  </span>
                )}
                {lessonsTotal > 0 && <span>{lessonsTotal} lessons</span>}
                {course.level && <span>{course.level}</span>}
                {course.enrolledCount > 0 && <span>{course.enrolledCount} enrolled</span>}
              </div>
            </div>
          </div>

          {/* About */}
          <section aria-labelledby="about-heading" className="mt-8">
            <h2 id="about-heading" className="font-display text-lg font-bold text-ink-900">
              About this course
            </h2>
            <p className="mt-2.5 whitespace-pre-line leading-relaxed text-ink-700">
              {course.roadmapSummary?.trim() || course.description}
            </p>
          </section>

          {/* Features */}
          {course.features.length > 0 && (
            <section aria-labelledby="features-heading" className="mt-8">
              <h2 id="features-heading" className="font-display text-lg font-bold text-ink-900">
                What you&apos;ll get
              </h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {course.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-ink-700">
                    <FeatureIcon feature={f} className="shrink-0 text-brand-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Curriculum */}
          <section aria-labelledby="curriculum-heading" className="mt-8">
            <h2 id="curriculum-heading" className="font-display text-lg font-bold text-ink-900">
              Curriculum
            </h2>
            {course.chapters.length > 0 ? (
              <>
                <p className="mt-0.5 text-xs text-ink-500">
                  {course.chapters.length} {course.chapters.length === 1 ? "chapter" : "chapters"}
                  {lessonsTotal > 0 && ` · ${lessonsTotal} lessons`}
                </p>
                <ol className="mt-3.5 flex flex-col gap-2.5">
                  {course.chapters.map((ch, index) => {
                    const chapterLessons = ch.topics.reduce((s, t) => s + t._count.lessons, 0);
                    return (
                      <li key={ch.id}>
                        <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-elev1" open={index === 0}>
                          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40">
                            <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-brand-50 text-[13px] font-extrabold text-brand-700">
                              {index + 1}
                            </span>
                            <span className="min-w-0 font-bold text-ink-900">{ch.title}</span>
                            <span className="ml-auto shrink-0 text-xs text-ink-500">
                              {chapterLessons} {chapterLessons === 1 ? "lesson" : "lessons"}
                            </span>
                            <ExpandMore
                              fontSize="small"
                              className="shrink-0 text-ink-500 transition-transform group-open:rotate-180"
                            />
                          </summary>
                          {ch.summary && (
                            <p className="border-t border-slate-100 px-4 py-3 text-sm whitespace-pre-line text-ink-600">
                              {ch.summary}
                            </p>
                          )}
                          {ch.topics.length > 0 ? (
                            <div className="border-t border-slate-100">
                              {ch.topics.map((t) => (
                                <div key={t.id} className="flex items-center gap-2.5 border-t border-slate-100 px-4 py-2.5 text-[13.5px] text-ink-700 first:border-t-0">
                                  <span className="min-w-0">{t.title}</span>
                                  <span className="ml-auto shrink-0 text-[11px] text-ink-500">
                                    {t._count.lessons} {t._count.lessons === 1 ? "lesson" : "lessons"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="border-t border-slate-100 px-4 py-3 text-sm text-ink-500">Lessons are being added.</p>
                          )}
                        </details>
                      </li>
                    );
                  })}
                </ol>
              </>
            ) : (
              <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-ink-600">
                The curriculum for this course is being finalised.
              </p>
            )}
          </section>

          {/* Mentors */}
          <section aria-labelledby="mentors-heading" className="mt-8">
            <h2 id="mentors-heading" className="font-display text-lg font-bold text-ink-900">
              Mentors
            </h2>
            {course.mentors.length > 0 ? (
              <ul className="mt-3.5 flex flex-col gap-3.5">
                {course.mentors.map((m) => {
                  const initials = `${m.user.firstName[0] ?? ""}${m.user.lastName[0] ?? ""}`.toUpperCase();
                  const cap = m.capacity && m.capacity > 0 ? m.capacity : null;
                  const pct = cap ? Math.max(0, Math.min(100, Math.round((m.free / cap) * 100))) : null;
                  return (
                    <li key={m.user.id} className="flex gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-elev1">
                      <div className="grid h-[52px] w-[52px] shrink-0 place-items-center overflow-hidden rounded-[14px] bg-brand-100 text-lg font-extrabold text-brand-700">
                        <CoverImage src={m.user.avatarUrl} alt="" fallback={initials} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-extrabold text-ink-900">
                          {m.user.firstName} {m.user.lastName}
                        </h3>
                        {m.user.bio ? (
                          <p className="mt-1 text-xs leading-relaxed text-ink-600">{m.user.bio}</p>
                        ) : (
                          <p className="mt-1 text-xs text-ink-600">Course mentor</p>
                        )}
                      </div>
                      {cap ? (
                        <div className="shrink-0 text-right">
                          <div className="text-[21px] font-extrabold leading-none text-brand-700">{m.free}</div>
                          <div className="mt-1 text-[11px] text-ink-500">seats left</div>
                          <div className="mt-2 h-[5px] w-[74px] overflow-hidden rounded-full bg-slate-100">
                            <i className="block h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ) : (
                        <div className="shrink-0 self-center text-right text-[11px] font-semibold text-brand-700">
                          Open seats
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <div className="mx-auto w-fit pl-20">
                  <TapLoader />
                </div>
                <p className="mt-5 font-display text-base font-bold text-ink-900">Waiting for a mentor</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-ink-600">
                  No mentor is assigned to this course yet. Check back soon — you can still apply to mentor below.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Enrolment rail — before enrolment / application */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <CourseActions
            courseId={course.id}
            slug={course.slug}
            pricePaise={course.pricePaise}
            currency={course.currency}
          />
          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-500">
            <WorkspacePremium className="mr-1 align-text-bottom text-slate-400" style={{ fontSize: 15 }} />
            Seats are limited. Learning content unlocks only after confirmed enrolment.
          </p>
          <div className="mt-5 flex flex-col gap-2 text-sm">
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
