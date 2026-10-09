import AdminCourseEditor from "@/components/app/admin/AdminCourseEditor";

export default async function EditAdminCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminCourseEditor courseId={id} />;
}
