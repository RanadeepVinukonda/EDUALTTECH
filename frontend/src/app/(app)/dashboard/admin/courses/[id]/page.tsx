import AdminCourseEditor from "@/components/app/admin/AdminCourseEditor";

export default async function EditAdminCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  return <AdminCourseEditor courseId={id} tab={tab} />;
}