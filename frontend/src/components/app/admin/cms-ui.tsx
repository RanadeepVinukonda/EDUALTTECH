"use client";

import { useEffect, useState } from "react";
import { ApiError, apiGet } from "@/lib/api";
import type { MediaAssetRow } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import Button from "@/components/ui/Button";
import { Skeleton, useAsync } from "./admin-ui";

export function cmsError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.code === "UNAUTHORIZED" || err.status === 401) return "Your session expired. Please sign in again.";
    if (err.code === "FORBIDDEN" || err.status === 403) return "You don’t have permission to perform this action.";
    if (err.code === "NOT_FOUND" || err.status === 404) return "That record no longer exists.";
    if (err.code === "VALIDATION") return err.message || "Please check the fields and try again.";
    if (err.code === "RATE_LIMITED" || err.status === 429) return "Too many requests. Please wait a moment.";
  }
  return err instanceof Error ? err.message : fallback;
}

export function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-ink-700">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** Modal shell for CMS forms. Escape closes (unless busy). */
export function CmsDialog({
  open,
  title,
  description,
  busy = false,
  onClose,
  footer,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  busy?: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink-900/40 p-4" role="presentation" onClick={() => !busy && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cms-dialog-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[20px] border border-slate-200 bg-white shadow-elev3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 id="cms-dialog-title" className="font-display text-lg font-bold text-ink-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>
      </div>
    </div>
  );
}

/** Pick one or more media assets from the CMS media library. */
export function MediaPicker({
  open,
  multiple = false,
  selected = [],
  onClose,
  onConfirm,
}: {
  open: boolean;
  multiple?: boolean;
  selected?: string[];
  onClose: () => void;
  onConfirm: (assets: MediaAssetRow[]) => void;
}) {
  const assets = useAsync(
    () => (open ? apiGet<{ assets: MediaAssetRow[] }>("/cms/admin/media") : Promise.resolve({ assets: [] })),
    [open],
  );
  const [picked, setPicked] = useState<MediaAssetRow[]>([]);

  useEffect(() => {
    if (open && assets.data) setPicked(assets.data.assets.filter((a) => selected.includes(a.id)));
    // re-seed only when the dialog opens or the asset list arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, assets.data]);

  if (!open) return null;

  function toggle(asset: MediaAssetRow) {
    setPicked((cur) => {
      if (!multiple) return [asset];
      return cur.some((x) => x.id === asset.id) ? cur.filter((x) => x.id !== asset.id) : [...cur, asset];
    });
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-900/50 p-4" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-[20px] border border-slate-200 bg-white shadow-elev3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 id="media-picker-title" className="font-display text-lg font-bold text-ink-900">
            {multiple ? "Select media" : "Select an image"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Pick from assets already registered in the media library.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {assets.error ? (
            <p className="text-sm text-red-700">{assets.error}</p>
          ) : assets.loading && !assets.data ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : assets.data && assets.data.assets.length > 0 ? (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {assets.data.assets.map((a) => {
                const on = picked.some((x) => x.id === a.id);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => toggle(a)}
                      aria-pressed={on}
                      title={a.alt ?? a.url}
                      className={`group block w-full overflow-hidden rounded-xl border-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 ${
                        on ? "border-brand-600" : "border-slate-200 hover:border-brand-300"
                      }`}
                    >
                      <span className="block aspect-square overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.url} alt={a.alt ?? ""} loading="lazy" className="h-full w-full object-cover" />
                      </span>
                      <span className="block truncate px-2 py-1 text-xs text-slate-600">{a.category ?? a.kind}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">No media assets yet. Add assets in the Media Library first.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-6 py-4">
          <p className="text-xs text-slate-500">{picked.length} selected</p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={() => onConfirm(picked)}>{multiple ? "Use selection" : "Use image"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Compact image preview + clear control for URL fields backed by the media library. */
export function MediaReference({
  url,
  onPick,
  onClear,
  alt,
}: {
  url: string;
  onPick: () => void;
  onClear: () => void;
  alt?: string;
}) {
  if (!url) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={onPick}>
        Choose from library
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt ?? ""} loading="lazy" className="h-14 w-20 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-slate-500">{url}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onPick}>Change</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClear}>Clear</Button>
      </div>
    </div>
  );
}

export function updatedLabel(iso: string): string {
  return formatDate(iso);
}
