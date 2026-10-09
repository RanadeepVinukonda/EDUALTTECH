import AuthProvider from "@/components/app/AuthProvider";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
