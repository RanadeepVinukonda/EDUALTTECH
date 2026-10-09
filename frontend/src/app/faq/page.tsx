import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import SectionHeading from "@/components/landing/SectionHeading";
import FaqBrowser, { type FaqItem } from "@/components/help/FaqBrowser";
import LinkButton from "@/components/ui/LinkButton";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const metadata: Metadata = {
  title: "Help & FAQ",
  description: "Answers to common questions about accounts, courses, payments, mentors, and policies.",
  alternates: { canonical: "/faq" },
};

const items: FaqItem[] = [
  {
    id: "create-account",
    category: "Accounts & verification",
    question: "How do I create an account?",
    answer: (
      <p>
        Register with your email address. We send a one-time code to that email, and you enter it to confirm the
        address before finishing your account details.
      </p>
    ),
  },
  {
    id: "verify-email",
    category: "Accounts & verification",
    question: "Why am I asked to verify my email?",
    answer: (
      <p>
        Verifying your email confirms the address belongs to you and keeps your account secure. Until it is
        verified, you cannot complete sign-in.
      </p>
    ),
  },
  {
    id: "browse-courses",
    category: "Courses & learning",
    question: "Do I need an account to browse courses?",
    answer: (
      <p>
        No. You can browse the course catalogue, view course details, and read about us without signing in. You
        will be asked to sign in when you want to enrol or save a course.
      </p>
    ),
  },
  {
    id: "free-vs-paid",
    category: "Enrolment & payments",
    question: "Are all courses paid?",
    answer: (
      <p>
        No. Some courses are free and you can join them directly. Paid courses require payment, and access is
        granted once the payment is verified and your enrolment succeeds.
      </p>
    ),
  },
  {
    id: "enrol",
    category: "Enrolment & payments",
    question: "How do I enrol in a course?",
    answer: (
      <p>
        Open a course and use the enrolment action. Free courses are joined immediately; paid courses take you to
        checkout. You can also save courses to your wishlist to return to them later.
      </p>
    ),
  },
  {
    id: "mentor",
    category: "Mentorship",
    question: "How do I become a mentor?",
    answer: (
      <p>
        Mentorship is per course. From a course you are interested in teaching, you can apply to mentor it.
        Applications are reviewed by our team, and teaching access is granted only after approval. You cannot be
        both a learner and a mentor in the same course.
      </p>
    ),
  },
  {
    id: "refunds",
    category: "Enrolment & payments",
    question: "Can I get a refund?",
    answer: (
      <p>
        Refunds are reviewed case by case. Requesting a refund does not automatically complete one — only an
        approved refund returns money. See our{" "}
        <Link href="/refund-policy" className="font-semibold text-brand-700 hover:underline">
          Refund &amp; Cancellation Policy
        </Link>
        .
      </p>
    ),
  },
  {
    id: "privacy",
    category: "Privacy & policies",
    question: "How is my information used?",
    answer: (
      <p>
        We use your information to run your account, courses, and mentorship features, and to respond to your
        enquiries. We do not sell your personal information. Read our{" "}
        <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    ),
  },
  {
    id: "contact",
    category: "Contact",
    question: "How do I reach you?",
    answer: (
      <p>
        Use our{" "}
        <Link href="/contact" className="font-semibold text-brand-700 hover:underline">
          contact page
        </Link>{" "}
        or email{" "}
        <a href="mailto:info@edualttech.com" className="font-semibold text-brand-700 hover:underline">
          info@edualttech.com
        </a>
        . We will respond by email.
      </p>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="bg-white">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className={`${wrap} py-10 sm:py-14`}>
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-ink-600">
              <li>
                <Link href="/" className="hover:text-ink-900">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-slate-400">
                <ChevronRight fontSize="small" />
              </li>
              <li className="font-medium text-ink-900" aria-current="page">
                Help &amp; FAQ
              </li>
            </ol>
          </nav>
          <SectionHeading
            as="h1"
            eyebrow="Help & FAQ"
            title="Frequently asked questions"
            lead="Quick answers about accounts, courses, payments, mentorship, and our policies."
          />
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className={`${wrap} max-w-4xl`}>
          <FaqBrowser items={items} />

          <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
            <h2 className="font-display text-xl font-bold text-ink-900">Still need help?</h2>
            <p className="mx-auto mt-2 max-w-xl text-ink-600">
              Send us your question and we will get back to you by email.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <LinkButton href="/contact">Contact us</LinkButton>
              <LinkButton href="/courses" variant="secondary">
                Browse courses
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
