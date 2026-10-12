"use client";

import { useRef, useState } from "react";
import UploadFile from "@mui/icons-material/UploadFile";
import { cn } from "@/lib/cn";

export default function Dropzone({
  accept,
  onFile,
  label = "Drag & drop a file here, or click to browse",
  hint = "PDF, DOC, DOCX, TXT or image · up to 5 MB",
  error = false,
  file,
  icon,
  id,
  name,
  ariaLabel,
  className,
}: {
  accept?: string;
  onFile: (file: File | null) => void;
  label?: string;
  hint?: string;
  error?: boolean;
  file?: File | null;
  icon?: React.ReactNode;
  id?: string;
  name?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        className="sr-only"
        aria-label={ariaLabel}
        onChange={(e) => {
          onFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition",
          over
            ? "border-brand-600 bg-brand-50"
            : error
              ? "border-danger bg-white"
              : "border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50",
          className,
        )}
      >
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-full",
            over ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500",
          )}
        >
          {icon ?? <UploadFile fontSize="small" />}
        </span>
        <span className="text-sm font-semibold text-ink-700">{file ? file.name : label}</span>
        <span className="text-xs text-slate-500">{file ? "Click to replace" : hint}</span>
      </button>
    </div>
  );
}
