import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { publicFetchStrict } from "@/lib/server-api";
import { siteUrl } from "@/lib/site";
import type { CourseDetailResponse } from "@/lib/types";
import CoverImage from "@/components/ui/CoverImage";
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
        <div role="alert" className="mx-auto max-w-md border-y border-slate-200 bg-paper-2 p-8">
          <h1 className="font-display text-xl font-semibold text-ink-900">We couldn&apos;t load this course</h1>
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
  if (course.features.includes("100% Free Resource")) redirect(`/resources/${course.slug}`);
  const lessonsTotal = course.chapters.reduce(
    (sum, ch) => sum + ch.topics.reduce((s, t) => s + t._count.lessons, 0),
    0,
  );
  const typeLabel = TYPE_LABEL[course.type] ?? "Course";

  const base = await siteUrl();
  // ponytail: one lesson G�� one hour; drop courseWorkload if real durations land in the data.
  const outcomeLines = (course.roadmapSummary ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const outcomes = outcomeLines.length > 1 ? outcomeLines : [];
  const skills = Array.from(new Set([...course.features, ...course.tags]));

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
    <div className="bg-paper">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="border-b border-slate-200 bg-paper-2">
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

      {/* Course header */}
      <header className={`${wrap} pb-8 pt-7 sm:pt-10`}>
        <h1 className="max-w-[900px] font-display text-display-s font-semibold leading-[1.08] tracking-tight text-ink-900 break-words">
          {course.title}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
          <span>{typeLabel}</span>
          {course.domain && <span className="border-l border-rule pl-3">{course.domain}</span>}
        </p>
        <p className="mt-4 max-w-3xl text-lead leading-7 text-ink-600">{course.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-500">
          <span>Self-paced</span>
          {course.level && (
            <>
              <span aria-hidden>·</span>
              <span>{course.level}</span>
            </>
          )}
          {course.enrolledCount > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>{course.enrolledCount.toLocaleString()} learners enrolled</span>
            </>
          )}
        </div>
      </header>
      </div>

      {/* Section tabs */}
      <nav aria-label="Course sections" className="border-b border-slate-200 bg-paper">
        <div className={`${wrap} -mb-px flex gap-6 overflow-x-auto`}>
          <a href="#about" className="whitespace-nowrap border-b-2 border-ink-900 py-3.5 text-[14px] font-medium text-ink-900">
            Overview
          </a>
          <a href="#syllabus" className="whitespace-nowrap border-b-2 border-transparent py-3.5 text-[14px] font-medium text-ink-500 hover:border-slate-300 hover:text-ink-900">
            Syllabus
          </a>
          <a href="#mentors" className="whitespace-nowrap border-b-2 border-transparent py-3.5 text-[14px] font-medium text-ink-500 hover:border-slate-300 hover:text-ink-900">
            Mentors
          </a>
        </div>
      </nav>

      <div className={`${wrap} grid gap-10 py-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16`}>
        <main className="min-w-0">
          {/* What you'll learn + skills */}
          <section id="about" aria-labelledby="learn-heading" className="scroll-mt-24">
            <h2 id="learn-heading" className="font-display text-[22px] font-semibold text-ink-900 sm:text-[26px]">
              {course.roadmapTitle?.trim() || "What you'll learn"}
            </h2>
            {course.learningOutcomes && course.learningOutcomes.length > 0 ? (
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {course.learningOutcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink-700">
                    <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-slate-400" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            ) : outcomes.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {outcomes.map((o) => (
                  <li key={o} className="flex gap-2.5 text-[15.5px] leading-7 text-ink-700">
                    <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                    {o}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 whitespace-pre-line text-[15.5px] leading-7 text-ink-700 break-words">
                {course.roadmapSummary?.trim() || course.description}
              </p>
            )}

            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-display text-sm font-semibold text-ink-900">
                  Prerequisites
                </h3>
                <ul className="mt-3 space-y-1.5">
                  {course.prerequisites.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-slate-700">
                      <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-slate-300" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {skills.length > 0 && (
              <>
                <h3 className="mt-8 font-display text-[18px] font-semibold text-ink-900">Skills you&apos;ll gain</h3>
                <p className="mt-2 text-[14.5px] leading-7 text-ink-700">{skills.join(", ")}</p>
              </>
            )}

            {outcomes.length > 0 && (
              <>
                <h3 className="mt-8 font-display text-[18px] font-semibold text-ink-900">About this course</h3>
                <p className="mt-2 whitespace-pre-line text-[15.5px] leading-7 text-ink-700 break-words">{course.description}</p>
              </>
            )}

          </section>

          {/* Syllabus */}
          <section id="syllabus" aria-labelledby="syllabus-heading" className="mt-12 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 id="syllabus-heading" className="font-display text-[22px] font-semibold text-ink-900 sm:text-[26px]">
              Syllabus
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-500">
              <span>{course.chapters.length} {course.chapters.length === 1 ? "module" : "modules"}</span>
              {lessonsTotal > 0 && <span className="border-l border-rule pl-3">{lessonsTotal} lessons</span>}
              <span className="border-l border-rule pl-3">Self-paced</span>
            </p>
            {course.chapters.length > 0 ? (
              <div className="mt-2 divide-y divide-slate-200 border-b border-slate-200">
                {course.chapters.map((ch, index) => {
                  const published = ch.topics.flatMap((t) => t.lessons);
                  const chapterLessons = ch.topics.reduce((s, t) => s + t._count.lessons, 0);
                  const hasMultipleTopics = ch.topics.length > 1;
                  return (
                    <details key={ch.id} className="group" open={index === 0}>
                      <summary className="flex cursor-pointer list-none items-start gap-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40">
                        <span aria-hidden className="mt-0.5 w-6 shrink-0 font-mono text-[12px] text-slate-400">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[16.5px] font-semibold leading-6 text-ink-900">{ch.title}</span>
                          <span className="mt-0.5 block text-[13px] text-ink-500">
                            {chapterLessons} {chapterLessons === 1 ? "lesson" : "lessons"}
                            {published.length > 0 && published.length < chapterLessons && ` (${published.length} available now)`}
                          </span>
                        </span>
                        <ExpandMore
                          fontSize="small"
                          className="mt-1 shrink-0 text-ink-500 transition-transform motion-reduce:transition-none group-open:rotate-180"
                        />
                      </summary>

                      <div className="pb-5 pl-12">
                        {ch.summary && (
                          <p className="mb-4 text-[14.5px] leading-6 text-ink-600 whitespace-pre-line break-words">{ch.summary}</p>
                        )}
                        {ch.topics.length > 0 ? (
                          ch.topics.map((t) => (
                            <div key={t.id} className="mt-3 first:mt-0">
                              {hasMultipleTopics && (
                                <p className="mb-1.5 text-sm font-medium text-ink-500">{t.title}</p>
                              )}
                              {t.lessons.length > 0 ? (
                                <ul>
                                  {t.lessons.map((l) => (
                                    <li key={l.id} className="flex items-center gap-3 py-2 text-[14.5px] text-ink-700">
                                      <span className="min-w-0 flex-1">{l.title}</span>
                                      <span className="shrink-0 text-[12.5px] font-medium text-ink-500">
                                        {l.type === "VIDEO" ? "Video" : "Reading"}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="py-1.5 text-[14px] text-ink-500">Lessons are being added.</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-[14px] text-ink-500">Lessons are being added.</p>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-[15px] text-ink-600">
                The curriculum for this course is being finalised.
              </p>
            )}
          </section>

          {/* Mentors */}
          <section id="mentors" aria-labelledby="mentors-heading" className="mt-12 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 id="mentors-heading" className="font-display text-[22px] font-semibold text-ink-900 sm:text-[26px]">
              Course mentors
            </h2>
            {course.mentors.length > 0 ? (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.mentors.map((m) => {
                  const initials = `${m.user.firstName[0] ?? ""}${m.user.lastName[0] ?? ""}`.toUpperCase();
                  const cap = m.capacity && m.capacity > 0 ? m.capacity : null;
                  return (
                    <li key={m.user.id} className="flex gap-3 rounded-xl border border-slate-200 p-4">
                      <div className="grid h-[52px] w-[52px] shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-base font-semibold text-ink-700">
                        <CoverImage src={m.user.avatarUrl} alt="" fallback={initials} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-semibold text-ink-900">
                          {m.user.firstName} {m.user.lastName}
                        </h3>
                        <p className="mt-0.5 text-[13px] leading-5 text-ink-600">{m.user.bio || "Course mentor"}</p>
                        <p className="mt-1.5 text-[12px] text-ink-500">
                          {cap ? `${m.free} of ${cap} seats left` : "Open seats"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <div className="mx-auto w-fit pl-20">
                  <TapLoader />
                </div>
                <p className="mt-5 font-display text-base font-semibold text-ink-900">Waiting for a mentor</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-ink-600">
                  No mentor is assigned to this course yet. Check back soon, or apply to mentor below.
                </p>
              </div>
            )}
          </section>
        </main>

        {/* Enrolment rail */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden border border-slate-200 bg-paper-2">
            <div className="relative aspect-video">
              {course.thumbnailUrl ? (
                <CoverImage src={course.thumbnailUrl} alt={course.title} fallback="" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-brand-700">
                  <span className="px-6 text-center font-display text-lg font-semibold text-white">{course.title}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <CourseActions courseId={course.id} slug={course.slug} pricePaise={course.pricePaise} currency={course.currency} />
          </div>

          <dl className="mt-4 divide-y divide-slate-200 border-y border-slate-200 px-4 text-[13.5px]">
            {course.enrolledCount > 0 && (
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-ink-600">Learners enrolled</dt>
                <dd className="font-semibold text-ink-900">{course.enrolledCount.toLocaleString()}</dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-ink-600">Modules</dt>
              <dd className="font-semibold text-ink-900">{course.chapters.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-ink-600">Lessons</dt>
              <dd className="font-semibold text-ink-900">{lessonsTotal}</dd>
            </div>
            {course.level && (
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-ink-600">Level</dt>
                <dd className="font-semibold text-ink-900">{course.level}</dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-ink-600">Schedule</dt>
              <dd className="font-semibold text-ink-900">Self-paced</dd>
            </div>
          </dl>

          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-500">
            Seats are limited. Learning content becomes available after confirmed enrolment.
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
