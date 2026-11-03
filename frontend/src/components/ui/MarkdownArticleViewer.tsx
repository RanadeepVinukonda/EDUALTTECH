"use client";

import { useState } from "react";
import ContentCopy from "@mui/icons-material/ContentCopy";
import Check from "@mui/icons-material/Check";
import { cn } from "@/lib/cn";

export interface MarkdownArticleViewerProps {
  content: string;
  className?: string;
}

function CodeBlockWithCopy({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API not permitted
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const displayLang = (lang || "code").toUpperCase();

  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-slate-800 shadow-md">
      {/* Code Header Bar with Language Badge and Copy Button */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Terminal Window Dots */}
          <div className="flex items-center gap-1.5 opacity-70">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 text-xs font-semibold text-slate-400">
            {displayLang}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition",
            copied
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          )}
        >
          {copied ? (
            <>
              <Check sx={{ fontSize: 14 }} className="text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <ContentCopy sx={{ fontSize: 13 }} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Text Content */}
      <pre className="overflow-x-auto bg-slate-950 p-4 font-mono text-[13px] leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Helper to parse inline bold, italic, code, and links */
function renderInlineText(raw: string): React.ReactNode[] {
  // Regex splitting on code, bold, links, etc.
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      parts.push(raw.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={`code-${match.index}`}
          className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-brand-700"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={`strong-${match.index}`} className="font-bold text-ink-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={`em-${match.index}`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const closingBracket = token.indexOf("](");
      const label = token.slice(1, closingBracket);
      const url = token.slice(closingBracket + 2, -1);
      parts.push(
        <a
          key={`link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-800"
        >
          {label}
        </a>
      );
    } else {
      parts.push(token);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < raw.length) {
    parts.push(raw.slice(lastIndex));
  }

  return parts;
}

export default function MarkdownArticleViewer({ content, className }: MarkdownArticleViewerProps) {
  if (!content || !content.trim()) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        No content written for this lesson yet.
      </div>
    );
  }

  // Split into tokens: fenced code blocks, markdown images, and normal text chunks
  // Regex to match code blocks ```lang\ncode\n``` or images ![alt](url)
  const blockRegex = /(```[\w-]*\n[\s\S]*?```|!\[[^\]]*\]\([^)]+\))/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  function processTextSection(text: string, baseKey: number) {
    const lines = text.split("\n");
    let inList = false;
    let listItems: React.ReactNode[] = [];

    function flushList(key: string) {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={key} className="my-3 list-disc space-y-1.5 pl-6 text-[15px] leading-relaxed text-slate-700">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    }

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      const lineKey = `${baseKey}-l-${lineIdx}`;

      // Blank line
      if (!trimmed) {
        flushList(`${lineKey}-flush`);
        return;
      }

      // Headings
      if (trimmed.startsWith("### ")) {
        flushList(`${lineKey}-flush`);
        elements.push(
          <h3 key={lineKey} className="mt-5 mb-2 font-display text-lg font-bold text-ink-900">
            {renderInlineText(trimmed.slice(4))}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith("## ")) {
        flushList(`${lineKey}-flush`);
        elements.push(
          <h2 key={lineKey} className="mt-7 mb-3 border-b border-slate-100 pb-1.5 font-display text-xl font-bold text-ink-900">
            {renderInlineText(trimmed.slice(3))}
          </h2>
        );
        return;
      }
      if (trimmed.startsWith("# ")) {
        flushList(`${lineKey}-flush`);
        elements.push(
          <h1 key={lineKey} className="mt-8 mb-4 font-display text-2xl sm:text-3xl font-extrabold text-ink-900">
            {renderInlineText(trimmed.slice(2))}
          </h1>
        );
        return;
      }

      // Blockquotes / Callout notes
      if (trimmed.startsWith("> ")) {
        flushList(`${lineKey}-flush`);
        const calloutText = trimmed.slice(2).trim();
        elements.push(
          <div
            key={lineKey}
            className="my-4 rounded-2xl border-l-4 border-amber-500 bg-amber-50/80 p-4 text-sm font-medium leading-relaxed text-amber-950 shadow-xs"
          >
            {renderInlineText(calloutText)}
          </div>
        );
        return;
      }

      // Bullet lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        inList = true;
        listItems.push(
          <li key={lineKey}>
            {renderInlineText(trimmed.slice(2))}
          </li>
        );
        return;
      }

      // Numbered lists
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        flushList(`${lineKey}-flush`);
        elements.push(
          <div key={lineKey} className="my-1.5 flex items-start gap-2 text-[15px] leading-relaxed text-slate-700">
            <span className="font-bold text-brand-700 min-w-5">{numMatch[1]}.</span>
            <div className="flex-1">{renderInlineText(numMatch[2])}</div>
          </div>
        );
        return;
      }

      // Regular paragraph
      flushList(`${lineKey}-flush`);
      elements.push(
        <p key={lineKey} className="my-2.5 text-[15px] leading-relaxed text-slate-700">
          {renderInlineText(line)}
        </p>
      );
    });

    flushList(`${baseKey}-end-flush`);
  }

  let chunkCount = 0;
  while ((match = blockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      processTextSection(content.slice(lastIndex, match.index), chunkCount++);
    }

    const block = match[0];
    const blockKey = `block-${chunkCount++}`;

    if (block.startsWith("```")) {
      // Code block
      const firstNewline = block.indexOf("\n");
      const lang = block.slice(3, firstNewline).trim();
      const code = block.slice(firstNewline + 1, -3).replace(/\n$/, "");
      elements.push(<CodeBlockWithCopy key={blockKey} code={code} lang={lang} />);
    } else if (block.startsWith("![") && block.includes("](") && block.endsWith(")")) {
      // Image
      const closingBracket = block.indexOf("](");
      const alt = block.slice(2, closingBracket);
      const url = block.slice(closingBracket + 2, -1);
      elements.push(
        <figure key={blockKey} className="my-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={alt || "Resource illustration"}
            className="w-full max-h-[500px] object-contain bg-slate-50"
            loading="lazy"
          />
          {alt ? (
            <figcaption className="border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-center text-xs text-slate-600">
              {alt}
            </figcaption>
          ) : null}
        </figure>
      );
    }

    lastIndex = blockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    processTextSection(content.slice(lastIndex), chunkCount);
  }

  return <div className={cn("article-markdown max-w-none", className)}>{elements}</div>;
}
