"use client";

// Razorpay ships an official checkout script (not an npm SDK). Load it on
// demand from Razorpay's CDN and reuse it across attempts.
const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let loader: Promise<boolean> | null = null;

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (payload: unknown) => void) => void;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

type RazorpayCtor = new (options: RazorpayOptions) => RazorpayInstance;

export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve(true);
  if (loader) return loader;

  loader = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(Boolean((window as unknown as { Razorpay?: RazorpayCtor }).Razorpay));
    script.onerror = () => {
      loader = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return loader;
}

export function createRazorpay(options: RazorpayOptions): RazorpayInstance | null {
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (!w.Razorpay) return null;
  return new w.Razorpay(options);
}
