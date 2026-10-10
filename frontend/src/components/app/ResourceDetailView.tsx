"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api";
import type { ResourceDetail } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import { notifyError } from "@/lib/notify";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Button, { buttonClass } from "@/components/ui/Button";

function formatBytes(bytes: number | null): string | null {
  if (bytes == null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResourceDetailView({ id }: { id: string }) {
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setNotFound(false);
    try {
      const { resource } = await apiGet<{ resource: ResourceDetail }>(`/resources/${id}`);
      setResource(resource);
    } catch (e) {
      if (e instanceof ApiError && (e.code === "NOT_FOUND" || e.status === 404)) setNotFound(true);
      else setError(e instanceof Error ? e.message : "Could not load this resource.");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openResource() {
    if (opening) return;
    setOpening(true);
    try {
      const { downloadUrl } = await apiGet<{ downloadUrl: string }>(`/resources/${id}/download`);
      if (!downloadUrl) {
        notifyError("This resource has no file or link to open.");
        return;
      }
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not open this resource.");
    } finally {
      setOpening(false);
    }
  }

  if (notFound)
    return (
      <EmptyState
        title="Resource not found"
        description="This resource doesn't exist or you don't have access to it."
        action={
          <Link href="/dashboard/resources" className={buttonClass("secondary", "sm")}>
            Back to library
          </Link>
        }
      />
    );
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!resource) return <Spinner label="Loading resource…" />;

  const size = formatBytes(resource.fileSizeBytes);
  const hasContent = !!(resource.storagePath || resource.url || resource.downloadUrl);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/dashboard/resources" className="hover:text-ink-700">
          Resources
        </Link>
        <span aria-hidden> / </span>
        <span className="text-ink-700">{resource.title}</span>
      </nav>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{resource.kind}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink-900">{resource.title}</h1>
        {!resource.isPublished && <p className="mt-1 text-sm text-amber-700">Draft (visible to you as owner or staff)</p>}
      </header>

      {resource.description && <p className="whitespace-pre-wrap text-slate-700">{resource.description}</p>}

      <dl className="grid gap-4 rounded-[20px] border border-slate-200 bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-ink-700">Course</dt>
          <dd className="mt-0.5 text-slate-600">{resource.course ? resource.course.title : "General library"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink-700">Uploaded by</dt>
          <dd className="mt-0.5 text-slate-600">
            {resource.owner.firstName} {resource.owner.lastName}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-ink-700">Added</dt>
          <dd className="mt-0.5 text-slate-600">{formatDate(resource.createdAt, { dateStyle: "medium" })}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink-700">Downloads</dt>
          <dd className="mt-0.5 text-slate-600">{resource.downloads}</dd>
        </div>
        {resource.mimeType && (
          <div>
            <dt className="font-semibold text-ink-700">File type</dt>
            <dd className="mt-0.5 text-slate-600">{resource.mimeType}</dd>
          </div>
        )}
        {size && (
          <div>
            <dt className="font-semibold text-ink-700">Size</dt>
            <dd className="mt-0.5 text-slate-600">{size}</dd>
          </div>
        )}
      </dl>

      {hasContent ? (
        <div>
          <Button onClick={() => void openResource()} loading={opening}>
            Open resource
          </Button>
        </div>
      ) : (
        <p role="note" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          This resource has no file or link attached.
        </p>
      )}
    </div>
  );
}
