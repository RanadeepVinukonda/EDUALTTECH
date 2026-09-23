import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CheckCircle,
  Globe,
  GraduationCap,
  Smartphone,
  BookOpen,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Digital solutions, marketing and classroom programs for schools and franchises — websites, apps, ERP, AI tools, admissions campaigns and hands-on AI & coding classes.",
  alternates: { canonical: "https://www.edualttech.com/services" },
};

const iconMap = {
  Globe: <Globe className="h-8 w-8" aria-hidden />,
  Smartphone: <Smartphone className="h-8 w-8" aria-hidden />,
  Brain: <Brain className="h-8 w-8" aria-hidden />,
  Zap: <Zap className="h-8 w-8" aria-hidden />,
  BookOpen: <BookOpen className="h-8 w-8" aria-hidden />,
  GraduationCap: <GraduationCap className="h-8 w-8" aria-hidden />,
} as const;

const SERVICES = [
  {
    icon: "Globe",
    title: "Websites & web apps",
    description: "Modern, fast sites and portals for schools, colleges and businesses.",
    features: ["School websites", "Admissions portals", "Student dashboards", "SEO ready"],
  },
  {
    icon: "Smartphone",
    title: "Apps & ERP",
    description: "Attendance, fees, timetables and communication — one system, not ten registers.",
    features: ["Mobile apps", "ERP modules", "Parent apps", "Integrations"],
  },
  {
    icon: "Brain",
    title: "AI tools",
    description: "Practical AI features built into your workflows — tutors, graders, helpers.",
    features: ["AI tutors", "Auto grading", "Content tools", "Custom agents"],
  },
  {
    icon: "Zap",
    title: "Marketing & admissions",
    description: "Ads, creatives and local listings that actually fill school seats.",
    features: ["Meta & Google ads", "Social creatives", "Google Business", "Lead tracking"],
  },
  {
    icon: "BookOpen",
    title: "Classroom programs",
    description: "AI, coding and problem-solving classes in your classrooms, taught by trained providers.",
    features: ["AI & coding clubs", "Trained mentors", "Curriculum included", "Showcase events"],
  },
  {
    icon: "GraduationCap",
    title: "Teacher training",
    description: "Get your faculty comfortable with digital classrooms and AI tools.",
    features: ["Hands-on workshops", "Tool onboarding", "Lesson workflows", "Follow-up support"],
  },
] as const;

export default function ServicesPage() {
  return (
    <div className="relative overflow-hidden bg-white px-6 pb-32 pt-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto mb-20 max-w-4xl text-center">
          <h1 className="mb-6 font-display text-5xl font-black leading-[0.9] tracking-tighter text-ink-700 md:text-7xl">
            Technology Solutions
            <br />
            for <span className="text-brand-600">Modern Schools</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-medium text-slate-600">
            Comprehensive digital solutions designed to empower educational institutions with
            cutting-edge technology.
          </p>
        </div>

        <div className="mb-20 grid gap-8 md:grid-cols-2">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="group rounded-xl border border-slate-200 bg-white p-10 transition-all duration-300 hover:-translate-y-1 hover:border-brand-400 hover:shadow-elev3"
            >
              <div className="mb-8 flex items-start gap-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-transform group-hover:scale-110">
                  {iconMap[service.icon]}
                </div>
                <div>
                  <h2 className="mb-2 font-display text-2xl font-black text-ink-700">
                    {service.title}
                  </h2>
                  <p className="leading-relaxed text-slate-600">{service.description}</p>
                </div>
              </div>
              <ul className="grid grid-cols-2 gap-3">
                {service.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 shrink-0 text-brand-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mb-16 rounded-xl border border-black/5 bg-slate-50 p-8 text-center shadow-elev1">
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600">
            Every service above is delivered by the <strong>Edu-Alt-Tech team</strong> — educators,
            engineers and trained classroom providers, not outsourced agency work.
          </p>
          <Link
            href="/about"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Meet the team <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-ink-800 p-14 text-center shadow-elev3 lg:p-20">
          <h2 className="relative z-10 mb-6 font-display text-4xl font-black tracking-tighter text-white md:text-5xl">
            Ready to Get Started?
          </h2>
          <p className="relative z-10 mx-auto mb-10 max-w-xl text-lg text-ink-200">
            Schedule a free consultation and discover how we can transform your school with
            technology.
          </p>
          <div className="relative z-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-xl bg-brand-600 px-10 py-5 font-semibold text-white shadow-elev2 transition-all hover:bg-brand-700"
            >
              Get a Free Consultation
            </Link>
            <Link
              href="/resources"
              className="rounded-xl border border-white/20 bg-white/10 px-10 py-5 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Explore Resources
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
