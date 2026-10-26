import NotFoundFace from "@/components/ui/NotFoundFace";
import NotFoundActions from "@/components/ui/NotFoundActions";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-28 text-center sm:px-6 lg:px-8">
      <NotFoundFace />
      <h1 className="mt-4 font-display text-3xl font-bold text-ink-900 sm:text-4xl">Page not found</h1>
      <p className="mt-4 max-w-md text-lg text-ink-600">
        The course or page you are looking for may have been removed, unpublished, or never existed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <NotFoundActions />
      </div>
    </div>
  );
}
