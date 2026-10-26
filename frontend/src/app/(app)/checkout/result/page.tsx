import type { Metadata } from "next";
import PaymentResultView from "@/components/app/PaymentResultView";

export const metadata: Metadata = { title: "Payment Result" };

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; status?: string }>;
}) {
  const { order, status } = await searchParams;
  return <PaymentResultView orderRef={order ?? null} cancelled={status === "cancelled"} />;
}
