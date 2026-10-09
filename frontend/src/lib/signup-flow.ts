"use client";

// Ephemeral signup wizard state. In-memory only — the verification code is
// never written to localStorage/sessionStorage or the URL. A hard refresh
// intentionally drops it and the user restarts from /verify-email.
interface SignupFlow {
  email: string;
  code: string;
  next?: string;
  devCode?: string;
  verified: boolean;
}

let flow: SignupFlow = { email: "", code: "", verified: false };

export function setSignupEmail(email: string, next?: string, devCode?: string): void {
  flow = { email, code: "", next, devCode, verified: false };
}

export function setSignupDevCode(devCode: string): void {
  flow.devCode = devCode;
}

export function setVerifiedCode(code: string): void {
  flow.code = code;
  flow.verified = true;
}

export function getSignupFlow(): Readonly<SignupFlow> {
  return flow;
}

export function clearSignupFlow(): void {
  flow = { email: "", code: "", verified: false };
}
