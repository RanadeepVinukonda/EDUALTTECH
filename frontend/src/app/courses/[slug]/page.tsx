import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CheckCircle from "@mui/icons-material/CheckCircle";
import WorkspacePremium from "@mui/icons-material/WorkspacePremium";
import ArrowForward from "@mui/icons-material/ArrowForward";
import LibraryBooks from "@mui/icons-material/LibraryBooks";
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

      {/* Logo-Matched Solid Green Course Hero (#025926) */}
      <div className="border-b border-[#02481f] bg-[#025926] text-white">
        <div className={`${wrap} pt-6`}>
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/85">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-white/60">
                <ChevronRight fontSize="small" />
              </li>
              <li>
                <Link href="/courses" className="transition-colors hover:text-white">
                  Courses
                </Link>
              </li>
              <li aria-hidden className="text-white/60">
                <ChevronRight fontSize="small" />
              </li>
              <li className="font-medium text-white" aria-current="page">
                {course.title}
              </li>
            </ol>
          </nav>
        </div>

        {/* Course header */}
        <header className={`${wrap} pb-10 pt-7 sm:pb-12 sm:pt-9`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#024059] px-3 py-1 text-xs font-semibold text-white">
              {typeLabel}
            </span>
            {course.domain && (
              <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white">
                {course.domain}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              <WorkspacePremium sx={{ fontSize: 14 }} className="text-white" aria-hidden />
              MSME Approved Certificate
            </span>
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-display-s font-semibold leading-[1.08] tracking-tight text-white break-words">
            {course.title}
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/90 sm:text-lg">
            {course.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5 text-xs font-medium text-white">
            <span className="rounded-lg border border-white/25 bg-white/15 px-3 py-1.5">
              {course.chapters.length} {course.chapters.length === 1 ? "Module" : "Modules"}
            </span>
            {lessonsTotal > 0 && (
              <span className="rounded-lg border border-white/25 bg-white/15 px-3 py-1.5">
                {lessonsTotal} Lessons
              </span>
            )}
            {course.level && (
              <span className="rounded-lg border border-white/25 bg-white/15 px-3 py-1.5">
                {course.level}
              </span>
            )}
            <span className="rounded-lg border border-white/25 bg-white/15 px-3 py-1.5">
              Self-paced
            </span>
            {course.enrolledCount > 0 && (
              <span className="rounded-lg bg-[#024059] px-3 py-1.5 font-semibold text-white">
                {course.enrolledCount.toLocaleString()} learners enrolled
              </span>
            )}
          </div>
        </header>
      </div>

      {/* Sticky Section Navigation Tabs */}
      <nav aria-label="Course sections" className="sticky top-16 z-30 border-b border-rule bg-[#ffffff]/95 backdrop-blur">
        <div className={`${wrap} -mb-px flex gap-6 overflow-x-auto`}>
          <a
            href="#about"
            className="whitespace-nowrap border-b-2 border-brand-600 py-3.5 text-sm font-semibold text-brand-800 transition-colors"
          >
            Overview
          </a>
          <a
            href="#syllabus"
            className="whitespace-nowrap border-b-2 border-transparent py-3.5 text-sm font-medium text-ink-2 transition-colors hover:border-brand-300 hover:text-ink"
          >
            Syllabus ({course.chapters.length})
          </a>
          <a
            href="#mentors"
            className="whitespace-nowrap border-b-2 border-transparent py-3.5 text-sm font-medium text-ink-2 transition-colors hover:border-brand-300 hover:text-ink"
          >
            Mentors
          </a>
        </div>
      </nav>

      <div className={`${wrap} grid gap-10 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12`}>
        <main className="min-w-0 space-y-10">
          {/* Overview: What you'll learn + skills */}
          <section id="about" aria-labelledby="learn-heading" className="scroll-mt-32">
            <div className="rounded-2xl border border-rule bg-[#ffffff] p-6 shadow-elev1 sm:p-8">
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.12em] text-brand-700">
                Course Overview
              </p>
              <h2 id="learn-heading" className="mt-1.5 font-display text-2xl font-semibold text-ink sm:text-[26px]">
                {course.roadmapTitle?.trim() || "What you'll learn"}
              </h2>

              {course.learningOutcomes && course.learningOutcomes.length > 0 ? (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {course.learningOutcomes.map((o) => (
                    <li
                      key={o}
                      className="flex items-start gap-2.5 rounded-xl border border-rule/70 bg-paper p-3.5 text-sm leading-relaxed text-ink-2"
                    >
                      <CheckCircle sx={{ fontSize: 18 }} className="mt-0.5 shrink-0 text-brand-600" aria-hidden />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              ) : outcomes.length > 0 ? (
                <ul className="mt-5 space-y-2.5">
                  {outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink-2">
                      <CheckCircle sx={{ fontSize: 18 }} className="mt-1 shrink-0 text-brand-600" aria-hidden />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 whitespace-pre-line text-[15.5px] leading-7 text-ink-2 break-words">
                  {course.roadmapSummary?.trim() || course.description}
                </p>
              )}

              {course.prerequisites && course.prerequisites.length > 0 && (
                <div className="mt-7 rounded-xl border border-rule bg-paper-2 p-5">
                  <h3 className="font-display text-sm font-semibold text-ink">Prerequisites</h3>
                  <ul className="mt-3 space-y-2">
                    {course.prerequisites.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-xs leading-relaxed text-ink-2 sm:text-sm">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {skills.length > 0 && (
                <div className="mt-7 border-t border-rule pt-6">
                  <h3 className="font-display text-base font-semibold text-ink">Skills you&apos;ll gain</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <li
                        key={skill}
                        className="rounded-full border border-brand-200/80 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-900"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {outcomes.length > 0 && (
                <div className="mt-7 border-t border-rule pt-6">
                  <h3 className="font-display text-base font-semibold text-ink">About this course</h3>
                  <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-ink-2 break-words">
                    {course.description}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Visual Roadmap Syllabus */}
          <section id="syllabus" aria-labelledby="syllabus-heading" className="scroll-mt-32">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-mono font-semibold uppercase tracking-[0.12em] text-brand-700">
                  Curriculum Roadmap
                </p>
                <h2 id="syllabus-heading" className="mt-1.5 font-display text-2xl font-semibold text-ink sm:text-[26px]">
                  Syllabus
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-2">
                <span className="rounded-full border border-rule bg-[#ffffff] px-3 py-1 shadow-elev1">
                  {course.chapters.length} {course.chapters.length === 1 ? "module" : "modules"}
                </span>
                {lessonsTotal > 0 && (
                  <span className="rounded-full border border-rule bg-[#ffffff] px-3 py-1 shadow-elev1">
                    {lessonsTotal} lessons
                  </span>
                )}
                <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-brand-800">
                  Self-paced
                </span>
              </div>
            </div>

            {course.chapters.length > 0 ? (
              <div className="mt-5 space-y-3">
                {course.chapters.map((ch, index) => {
                  const published = ch.topics.flatMap((t) => t.lessons);
                  const chapterLessons = ch.topics.reduce((s, t) => s + t._count.lessons, 0);
                  const hasMultipleTopics = ch.topics.length > 1;
                  return (
                    <details
                      key={ch.id}
                      open={index === 0}
                      className="group overflow-hidden rounded-2xl border border-rule bg-[#ffffff] shadow-elev1 transition-all open:border-brand-300 open:shadow-elev2"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40">
                        <span
                          aria-hidden
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 font-mono text-xs font-bold text-brand-800 transition-colors group-open:border-brand-600 group-open:bg-brand-600 group-open:text-white"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-display text-base font-semibold leading-snug text-ink sm:text-[17px]">
                            {ch.title}
                          </span>
                          <span className="mt-1 inline-flex flex-wrap items-center gap-2 text-xs text-muted">
                            <span className="inline-flex items-center gap-1 font-medium text-ink-2">
                              <LibraryBooks sx={{ fontSize: 13 }} className="text-brand-600" aria-hidden />
                              {chapterLessons} {chapterLessons === 1 ? "lesson" : "lessons"}
                            </span>
                            {published.length > 0 && published.length < chapterLessons && (
                              <span>· {published.length} available now</span>
                            )}
                          </span>
                        </span>
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rule bg-paper text-ink-2 transition-colors group-open:border-brand-200 group-open:bg-brand-50 group-open:text-brand-700">
                          <ExpandMore
                            fontSize="small"
                            className="transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180"
                          />
                        </span>
                      </summary>

                      <div className="border-t border-rule/70 bg-paper/50 px-5 py-5 sm:px-6">
                        {ch.summary && (
                          <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-ink-2 break-words">
                            {ch.summary}
                          </p>
                        )}
                        {ch.topics.length > 0 ? (
                          <div className="space-y-4 border-l-2 border-brand-200 pl-4">
                            {ch.topics.map((t) => (
                              <div key={t.id}>
                                {hasMultipleTopics && (
                                  <p className="mb-2 font-display text-sm font-semibold text-ink">{t.title}</p>
                                )}
                                {t.lessons.length > 0 ? (
                                  <ul className="space-y-1.5">
                                    {t.lessons.map((l) => (
                                      <li
                                        key={l.id}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-rule/60 bg-[#ffffff] px-3.5 py-2.5 text-sm text-ink-2"
                                      >
                                        <span className="min-w-0 flex-1 font-medium text-ink">{l.title}</span>
                                        <span className="shrink-0 rounded-full border border-rule bg-paper-2 px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                                          {l.type === "VIDEO" ? "Video" : "Reading"}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs italic text-muted">Lessons are being added for this topic.</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted">Lessons are being added.</p>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-rule bg-paper-2 p-6 text-sm text-ink-2">
                The curriculum for this course is being finalised.
              </p>
            )}
          </section>

          {/* Mentors */}
          <section id="mentors" aria-labelledby="mentors-heading" className="scroll-mt-32">
            <p className="text-xs font-mono font-semibold uppercase tracking-[0.12em] text-brand-700">
              Guided Learning
            </p>
            <h2 id="mentors-heading" className="mt-1.5 font-display text-2xl font-semibold text-ink sm:text-[26px]">
              Course mentors
            </h2>
            {course.mentors.length > 0 ? (
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {course.mentors.map((m) => {
                  const initials = `${m.user.firstName[0] ?? ""}${m.user.lastName[0] ?? ""}`.toUpperCase();
                  const cap = m.capacity && m.capacity > 0 ? m.capacity : null;
                  return (
                    <li
                      key={m.user.id}
                      className="flex gap-4 rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1 transition-all hover:border-brand-300 hover:shadow-elev2"
                    >
                      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-rule bg-paper-2 text-base font-semibold text-ink">
                        <CoverImage
                          src={m.user.avatarUrl}
                          alt=""
                          fallback={initials}
                          className="h-full w-full object-cover object-top"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-semibold text-ink">
                          {m.user.firstName} {m.user.lastName}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-ink-2">{m.user.bio || "Course mentor"}</p>
                        <span className="mt-2.5 inline-block rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-800">
                          {cap ? `${m.free} of ${cap} seats left` : "Open seats"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-rule bg-[#ffffff] px-6 py-10 text-center shadow-elev1">
                <div className="mx-auto w-fit pl-20">
                  <TapLoader />
                </div>
                <p className="mt-5 font-display text-lg font-semibold text-ink">Waiting for a mentor</p>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-2">
                  No mentor is assigned to this course yet. Check back soon, or apply to teach this course as a paid mentor.
                </p>
                <div className="mt-5">
                  <Link
                    href="/mentor"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-100"
                  >
                    Apply to mentor this course
                    <ArrowForward sx={{ fontSize: 14 }} aria-hidden />
                  </Link>
                </div>
              </div>
            )}
          </section>
        </main>

        {/* Sticky Enrolment Rail */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-rule bg-[#ffffff] shadow-elev2">
            <div className="relative aspect-video overflow-hidden bg-paper-2">
              {course.thumbnailUrl ? (
                <CoverImage src={course.thumbnailUrl} alt={course.title} fallback="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-[#025926] p-6">
                  <span className="text-center font-display text-lg font-semibold text-white">{course.title}</span>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6">
              <CourseActions courseId={course.id} slug={course.slug} pricePaise={course.pricePaise} currency={course.currency} />

              {/* Prominent MSME Approved Certificate Badge */}
              <div className="mt-5 flex items-center gap-3.5 rounded-xl border border-brand-200/90 bg-brand-50/70 p-3.5 shadow-elev1">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-[#ffffff] p-1.5 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/media/logos/msme-seeklogo.png"
                    alt="MSME Government of India"
                    className="h-full w-full object-contain"
                    width={48}
                    height={48}
                  />
                </div>
                <div className="min-w-0 leading-snug">
                  <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                    Govt. of India Registered
                  </span>
                  <span className="block text-xs font-bold text-ink">MSME Approved Certificate</span>
                  <span className="block text-[11px] text-ink-2">Included upon completion</span>
                </div>
              </div>

              <dl className="mt-5 divide-y divide-rule border-y border-rule text-sm">
                {course.enrolledCount > 0 && (
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-ink-2">Learners enrolled</dt>
                    <dd className="font-semibold text-ink">{course.enrolledCount.toLocaleString()}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-ink-2">Modules</dt>
                  <dd className="font-semibold text-ink">{course.chapters.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-ink-2">Lessons</dt>
                  <dd className="font-semibold text-ink">{lessonsTotal}</dd>
                </div>
                {course.level && (
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-ink-2">Level</dt>
                    <dd className="font-semibold text-ink">{course.level}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-ink-2">Schedule</dt>
                  <dd className="font-semibold text-ink">Self-paced</dd>
                </div>
              </dl>

              <p className="mt-4 text-[11.5px] leading-relaxed text-muted">
                Seats are limited. Learning content becomes available after confirmed enrolment.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-4 text-xs">
                <Link href="/courses" className="font-semibold text-brand-700 hover:text-brand-800">
                  ← Back to all courses
                </Link>
                <Link href="/contact" className="font-medium text-ink-2 hover:text-ink">
                  Questions? Contact us
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
