import AdminUserDetail from "@/components/app/admin/AdminUserDetail";

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const email = Array.isArray(sp.email) ? sp.email[0] ?? null : sp.email ?? null;
  return <AdminUserDetail id={id} email={email} />;
}
