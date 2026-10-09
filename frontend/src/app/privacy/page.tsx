import type { Metadata } from "next";
import Link from "next/link";
import LegalDocument, { type LegalSection } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How EduAltTech collects, uses, and protects personal information.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "scope",
    heading: "Scope of this policy",
    body: (
      <p>
        This policy describes how EduAltTech (operated under Setsuzoku) handles personal information when you
        use our website, courses, and related services.
      </p>
    ),
  },
  {
    id: "collect",
    heading: "Information we collect",
    body: (
      <>
        <p>We collect information you provide directly, including:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Account details such as your name and email address when you register.</li>
          <li>Profile details you choose to add, such as your education level or institution.</li>
          <li>Information you submit through our contact form.</li>
          <li>Messages you send through course conversations.</li>
        </ul>
        <p>
          When you enrol in or progress through a course, we store your participation and lesson-completion
          status so the course can function.
        </p>
      </>
    ),
  },
  {
    id: "use",
    heading: "How we use information",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>To create and secure your account and verify your email.</li>
        <li>To provide courses, resources, meetings, and mentorship features.</li>
        <li>To respond to enquiries you send us.</li>
        <li>To keep the platform safe and working as intended.</li>
      </ul>
    ),
  },
  {
    id: "payments",
    heading: "Payments",
    body: (
      <p>
        Paid course payments are processed by our third-party payment provider. We do not store full card
        details on our servers. We retain records of orders and their status to provide access and support.
      </p>
    ),
  },
  {
    id: "auth-cookies",
    heading: "Authentication and local storage",
    body: (
      <p>
        We use an authentication provider to manage sign-in sessions. A session is stored in your browser so you
        stay signed in; signing out clears it. We do not add advertising or third-party tracking cookies.
      </p>
    ),
  },
  {
    id: "sharing",
    heading: "How information is shared",
    body: (
      <p>
        We do not sell your personal information. We share it only with service providers that help us run the
        platform (such as authentication, email delivery, and payment processing), and where required by law.
      </p>
    ),
  },
  {
    id: "retention",
    heading: "Data retention",
    body: (
      <p>
        We keep personal information for as long as your account is active or as needed to provide the services.
        You may ask us to delete your account and associated personal data, subject to any records we are
        required to keep.
      </p>
    ),
  },
  {
    id: "rights",
    heading: "Your choices and rights",
    body: (
      <p>
        You can update your profile information from your account. To request a copy of your data or its
        deletion, contact us at{" "}
        <a href="mailto:info@edualttech.com" className="font-semibold text-brand-700 hover:underline">
          info@edualttech.com
        </a>
        .
      </p>
    ),
  },
  {
    id: "security",
    heading: "Security",
    body: (
      <p>
        We take reasonable measures to protect your information, including access controls on who may view
        accounts and orders. No system is perfectly secure, and we cannot guarantee absolute security.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: (
      <p>
        We may update this policy from time to time. Material changes will be reflected on this page. Continued
        use of the service after an update means you accept the revised policy.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact",
    body: (
      <p>
        Questions about this policy? Use our{" "}
        <Link href="/contact" className="font-semibold text-brand-700 hover:underline">
          contact page
        </Link>{" "}
        or email{" "}
        <a href="mailto:info@edualttech.com" className="font-semibold text-brand-700 hover:underline">
          info@edualttech.com
        </a>
        . See also our{" "}
        <Link href="/terms" className="font-semibold text-brand-700 hover:underline">
          Terms of Service
        </Link>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      intro="How we collect, use, and protect your personal information when you use EduAltTech."
      draft="This is a working draft pending legal approval. An effective date will be added once the policy is finalised."
      sections={SECTIONS}
    />
  );
}
