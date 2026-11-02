"use client";

import { useRef, useState } from "react";
import Button, { buttonClass } from "@/components/ui/Button";
import MarkdownArticleViewer from "@/components/ui/MarkdownArticleViewer";
import { cn } from "@/lib/cn";
import FormatBold from "@mui/icons-material/FormatBold";
import FormatItalic from "@mui/icons-material/FormatItalic";
import FormatListBulleted from "@mui/icons-material/FormatListBulleted";
import FormatListNumbered from "@mui/icons-material/FormatListNumbered";
import FormatQuote from "@mui/icons-material/FormatQuote";
import Code from "@mui/icons-material/Code";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import LinkIcon from "@mui/icons-material/Link";
import Visibility from "@mui/icons-material/Visibility";
import Edit from "@mui/icons-material/Edit";

const LANGS = ["javascript", "typescript", "python", "java", "c", "cpp", "csharp", "go", "rust", "sql", "bash", "html", "css", "json", "jsx", "tsx"];

type Popover = "code" | "image" | null;

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  rows?: number;
  minHeightClass?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  ariaLabel,
  placeholder = "Write the lesson in Markdown — headings, lists, code, images…",
  rows = 14,
  minHeightClass = "min-h-[18rem]",
}: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [popover, setPopover] = useState<Popover>(null);
  const [lang, setLang] = useState("javascript");
  const [imgUrl, setImgUrl] = useState("");
  const [imgAlt, setImgAlt] = useState("");

  function insert(before: string, after = "", fallback = "") {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    const caret = start + before.length + selected.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, caret);
    });
  }

  function insertBlock(text: string) {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const needsBreak = start > 0 && value[start - 1] !== "\n";
    const prefix = needsBreak ? "\n\n" : "";
    const next = value.slice(0, start) + prefix + text + "\n" + value.slice(el?.selectionEnd ?? start);
    onChange(next);
    const caret = start + prefix.length + text.length + 1;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  }

  function addCode() {
    const fence = "```" + (lang.trim() || "") + "\n" + "// your code\n" + "```";
    insertBlock(fence);
    setPopover(null);
  }

  function addImage() {
    const url = imgUrl.trim();
    if (!url) return;
    const alt = imgAlt.trim();
    insertBlock(`![${alt}](${url})`);
    setImgUrl("");
    setImgAlt("");
    setPopover(null);
  }

  const tool = "rounded-lg p-2 text-ink-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40";
  const activeTool = "bg-brand-50 text-brand-700";

  const buttons: { label: string; icon: React.ReactNode; onClick: () => void; active?: boolean }[] = [
    { label: "Bold", icon: <FormatBold fontSize="small" />, onClick: () => insert("**", "**", "bold text") },
    { label: "Italic", icon: <FormatItalic fontSize="small" />, onClick: () => insert("*", "*", "italic text") },
    { label: "Heading", icon: <span className="font-display text-xs font-bold">H2</span>, onClick: () => insertBlock("## Heading") },
    { label: "Subheading", icon: <span className="font-display text-xs font-bold">H3</span>, onClick: () => insertBlock("### Subheading") },
    { label: "Bullet list", icon: <FormatListBulleted fontSize="small" />, onClick: () => insertBlock("- First point\n- Second point") },
    { label: "Numbered list", icon: <FormatListNumbered fontSize="small" />, onClick: () => insertBlock("1. First step\n2. Second step") },
    { label: "Callout", icon: <FormatQuote fontSize="small" />, onClick: () => insertBlock("> Note: something worth highlighting") },
    { label: "Link", icon: <LinkIcon fontSize="small" />, onClick: () => insert("[", "](https://)", "link text") },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/80 px-2 py-1.5">
        <div className="flex items-center gap-0.5" role="group" aria-label="Formatting">
          {buttons.map((b) => (
            <button
              key={b.label}
              type="button"
              title={b.label}
              aria-label={b.label}
              className={cn(tool, b.active && activeTool)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={b.onClick}
            >
              {b.icon}
            </button>
          ))}
          <span aria-hidden className="mx-1 h-5 w-px bg-slate-200" />
          <button
            type="button"
            title="Code block"
            aria-label="Code block"
            aria-expanded={popover === "code"}
            className={cn(tool, popover === "code" && activeTool)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setPopover((p) => (p === "code" ? null : "code"))}
          >
            <Code fontSize="small" />
          </button>
          <button
            type="button"
            title="Image"
            aria-label="Image"
            aria-expanded={popover === "image"}
            className={cn(tool, popover === "image" && activeTool)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setPopover((p) => (p === "image" ? null : "image"))}
          >
            <ImageOutlined fontSize="small" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-lg bg-white p-0.5 ring-1 ring-slate-200">
          <button
            type="button"
            className={buttonClass(mode === "write" ? "primary" : "ghost", "sm", "gap-1 px-2 py-1 text-xs")}
            aria-pressed={mode === "write"}
            onClick={() => setMode("write")}
          >
            <Edit sx={{ fontSize: 15 }} aria-hidden />
            Write
          </button>
          <button
            type="button"
            className={buttonClass(mode === "preview" ? "primary" : "ghost", "sm", "gap-1 px-2 py-1 text-xs")}
            aria-pressed={mode === "preview"}
            onClick={() => setMode("preview")}
          >
            <Visibility sx={{ fontSize: 15 }} aria-hidden />
            Preview
          </button>
        </div>
      </div>

      {popover === "code" && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
          <label className="text-xs font-semibold text-ink-700" htmlFor="md-editor-lang">Language</label>
          <input
            id="md-editor-lang"
            list="md-editor-langs"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-40 rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs outline-none focus:border-brand-600"
            placeholder="javascript"
          />
          <datalist id="md-editor-langs">
            {LANGS.map((l) => <option key={l} value={l} />)}
          </datalist>
          <Button type="button" size="sm" onClick={addCode}>Insert code</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setPopover(null)}>Cancel</Button>
        </div>
      )}

      {popover === "image" && (
        <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 sm:flex-row sm:items-center">
          <input
            type="url"
            value={imgUrl}
            onChange={(e) => setImgUrl(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-600"
            placeholder="https://… image URL"
            aria-label="Image URL"
          />
          <input
            value={imgAlt}
            onChange={(e) => setImgAlt(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-600 sm:w-56"
            placeholder="Caption / alt text"
            aria-label="Image caption"
          />
          <div className="flex gap-1">
            <Button type="button" size="sm" disabled={!imgUrl.trim()} onClick={addImage}>Insert</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPopover(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {mode === "write" ? (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          aria-label={ariaLabel}
          placeholder={placeholder}
          className={cn(
            "w-full resize-y border-0 bg-white px-4 py-3 font-mono text-[13.5px] leading-relaxed text-ink-900 outline-none placeholder:text-slate-400",
            minHeightClass,
          )}
        />
      ) : (
        <div className={cn("overflow-auto px-4 py-3", minHeightClass)}>
          {value.trim() ? (
            <MarkdownArticleViewer content={value} />
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
