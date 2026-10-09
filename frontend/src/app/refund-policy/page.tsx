import type { Metadata } from "next";
import Link from "next/link";
import LegalDocument, { type LegalSection } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "How refund requests and cancellations work for paid EduAltTech courses.",
  alternates: { canonical: "/refund-policy" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "overview",
    heading: "Overview",
    body: (
      <p>
        This policy explains how refunds and cancellations are handled for paid courses. Requesting a refund and
        receiving one are different: submitting a request does not by itself complete a refund. Only an approved
        refund, processed through our payment provider, results in money being returned.
      </p>
    ),
  },
  {
    id: "eligibility",
    heading: "Refund eligibility",
    body: (
      <p>
        Refund eligibility depends on the circumstances of your enrollment and whether you have accessed the
        course. Because our stated eligibility terms are not yet finalised, please contact us with your details
        and we will assess your request. We will not apply a blanket refund window until it is formally approved.
      </p>
    ),
  },
  {
    id: "cancellation",
    heading: "Cancellation",
    body: (
      <p>
        If you wish to cancel an enrollment, contact us with your order details. Cancellation does not
        automatically trigger a refund; it will be reviewed together with your request.
      </p>
    ),
  },
  {
    id: "process",
    heading: "How to request a refund",
    body: (
      <p>
        Contact us through our{" "}
        <Link href="/contact" className="font-semibold text-brand-700 hover:underline">
          contact page
        </Link>{" "}
        with your name, the course, and your order reference. Note that the platform does not currently provide
        an automated in-app refund button; requests are handled by our team.
      </p>
    ),
  },
  {
    id: "timing",
    heading: "Processing",
    body: (
      <p>
        Once a refund is approved, processing time depends on your payment method and provider. We cannot commit
        to a specific number of days until this is confirmed. You will be informed of the outcome of your request.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact",
    body: (
      <p>
        Questions about a refund or cancellation? Reach us via the{" "}
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

export default function RefundPolicyPage() {
  return (
    <LegalDocument
      title="Refund & Cancellation Policy"
      intro="How refund requests and cancellations are handled for paid EduAltTech courses."
      draft="This is a working draft pending legal approval. Specific eligibility windows and processing times must be confirmed before publication."
      sections={SECTIONS}
    />
  );
}
