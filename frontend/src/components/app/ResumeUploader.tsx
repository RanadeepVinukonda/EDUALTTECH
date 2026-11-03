"use client";

import { useRef, useState } from "react";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import OpenInNew from "@mui/icons-material/OpenInNew";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { notifyError, notifySuccess } from "@/lib/notify";
import Button from "@/components/ui/Button";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ResumeUploaderProps {
  resumeName?: string | null;
  resumeUpdatedAt?: string | null;
  className?: string;
  onSuccess?: () => void;
}

export default function ResumeUploader({
  resumeName,
  resumeUpdatedAt,
  className = "",
  onSuccess,
}: ResumeUploaderProps) {
  const { refresh } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const lower = file.name.toLowerCase();
    const isDoc =
      lower.endsWith(".pdf") ||
      lower.endsWith(".doc") ||
      lower.endsWith(".docx") ||
      file.type.includes("pdf") ||
      file.type.includes("word") ||
      file.type.includes("document");

    if (!isDoc) {
      notifyError("Please choose a PDF or Word document (.pdf, .doc, .docx).");
      return;
    }

    if (file.size > MAX_BYTES) {
      notifyError("Resume file is too large — keep it under 5 MB.");
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read that file."));
        reader.readAsDataURL(file);
      });
      const data = dataUrl.slice(dataUrl.indexOf(",") + 1);
      const mimeType = file.type || (lower.endsWith(".pdf") ? "application/pdf" : "application/octet-stream");

      await apiPost<{ resumeName: string; resumeUpdatedAt: string }>("/auth/resume", {
        name: file.name,
        type: mimeType,
        data,
      });

      await refresh();
      notifySuccess("Resume uploaded successfully.");
      onSuccess?.();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Could not upload resume.");
    } finally {
      setBusy(false);
    }
  }

  async function viewResume() {
    setOpening(true);
    try {
      const res = await apiGet<{ name: string; url: string }>("/auth/resume");
      if (res.url) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Could not open resume.");
    } finally {
      setOpening(false);
    }
  }

  async function removeResume() {
    if (!window.confirm("Are you sure you want to remove your resume?")) return;
    setBusy(true);
    try {
      await apiDelete<{ ok: true }>("/auth/resume");
      await refresh();
      notifySuccess("Resume removed.");
      onSuccess?.();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Could not remove resume.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        aria-label="Upload resume file"
        onChange={onPick}
      />

      {resumeName ? (
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <DescriptionOutlined fontSize="small" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">{resumeName}</p>
              <p className="text-xs text-slate-500">
                {resumeUpdatedAt
                  ? `Updated ${new Date(resumeUpdatedAt).toLocaleDateString()}`
                  : "Uploaded to profile"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
            <button
              type="button"
              onClick={viewResume}
              disabled={opening}
              aria-label={opening ? "Opening resume" : "View resume"}
              title={opening ? "Opening resume" : "View resume"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-ink-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 disabled:opacity-50"
            >
              <OpenInNew fontSize="small" />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              aria-label="Replace resume"
              title="Replace resume"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-ink-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 disabled:opacity-50"
            >
              <CloudUploadOutlined fontSize="small" />
            </button>
            <button
              type="button"
              onClick={removeResume}
              disabled={busy}
              aria-label="Remove resume"
              title="Remove resume"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/40 disabled:opacity-50"
            >
              <DeleteOutlined fontSize="small" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <CloudUploadOutlined fontSize="medium" />
          </div>
          <h4 className="mt-3 text-sm font-semibold text-ink-900">Upload your resume</h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            PDF or Word document up to 5 MB. Save it here to reuse when applying to mentor any course.
          </p>
          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={busy}
              onClick={() => inputRef.current?.click()}
            >
              Choose document
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
