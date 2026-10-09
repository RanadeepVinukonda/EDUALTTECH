import type { Metadata } from "next";
import Link from "next/link";
import LegalDocument, { type LegalSection } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of EduAltTech.",
  alternates: { canonical: "/terms" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    heading: "Acceptance of these terms",
    body: (
      <p>
        By creating an account or using EduAltTech, you agree to these terms. If you do not agree, please do not
        use the service.
      </p>
    ),
  },
  {
    id: "accounts",
    heading: "Accounts",
    body: (
      <p>
        You are responsible for keeping your account credentials secure and for activity under your account. You
        must provide accurate information and verify your email address. Accounts have a platform role of either
        User or Administrator; administrators are appointed by EduAltTech.
      </p>
    ),
  },
  {
    id: "participation",
    heading: "Course participation and mentorship",
    body: (
      <>
        <p>
          Participation in a course is separate from your platform role. Your participation in a specific course
          is either as a Learner or as a Mentor, and you cannot hold both roles in the same course.
        </p>
        <p>
          Applying to mentor a course does not grant teaching access. Mentor participation is reviewed and
          approved per course before any teaching access is provided.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    heading: "Payments and course access",
    body: (
      <p>
        Some courses require payment. Access to a paid course is provided only after payment is verified and
        enrolment succeeds. Free courses can be joined directly. See our{" "}
        <Link href="/refund-policy" className="font-semibold text-brand-700 hover:underline">
          Refund &amp; Cancellation Policy
        </Link>{" "}
        for payment-related questions.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    heading: "Acceptable use",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Do not misuse, disrupt, or attempt to gain unauthorised access to the service.</li>
        <li>Do not upload unlawful or harmful content or infringe others&apos; rights.</li>
        <li>Do not share course materials outside the intended learning context.</li>
      </ul>
    ),
  },
  {
    id: "content-ip",
    heading: "Content and intellectual property",
    body: (
      <p>
        Course content, materials, and the platform are owned by EduAltTech or its licensors and are provided for
        your personal learning. You may not redistribute them without permission.
      </p>
    ),
  },
  {
    id: "availability",
    heading: "Service availability",
    body: (
      <p>
        We aim to keep the service available but do not guarantee uninterrupted access. We may modify, suspend,
        or discontinue features.
      </p>
    ),
  },
  {
    id: "termination",
    heading: "Suspension and termination",
    body: (
      <p>
        We may suspend or terminate access if these terms are breached or to protect the service or other users.
        You may stop using the service at any time.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to these terms",
    body: (
      <p>
        We may update these terms. Material changes will be reflected on this page, and continued use after an
        update means you accept the revised terms.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact",
    body: (
      <p>
        Questions about these terms? Visit our{" "}
        <Link href="/contact" className="font-semibold text-brand-700 hover:underline">
          contact page
        </Link>
        . See also our{" "}
        <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      intro="The terms that govern your use of EduAltTech, its courses, mentorship features, and materials."
      draft="This is a working draft pending legal approval. An effective date will be added once the terms are finalised."
      sections={SECTIONS}
    />
  );
}
