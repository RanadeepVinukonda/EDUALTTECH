import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CheckoutView from "@/components/app/CheckoutView";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course } = await searchParams;
  if (!course) redirect("/courses");
  return <CheckoutView slug={course} />;
}
