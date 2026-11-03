"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ExpandMore from "@mui/icons-material/ExpandMore";
import LibraryBooks from "@mui/icons-material/LibraryBooks";
import { api } from "@/lib/api";
import type { ResourceCatalogItem } from "@/lib/types";
import { cn } from "@/lib/cn";

export interface ResourceTopic {
  name: string;
  slug: string;
}

interface Props {
  triggerClassName?: string;
  compact?: boolean;
  showChevron?: boolean;
  active?: boolean;
  align?: "left" | "right" | "center";
  placement?: "down" | "up";
}

export function slugify(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}

export function useResourceTopics(): ResourceTopic[] {
  const [resources, setResources] = useState<ResourceCatalogItem[]>([]);

  useEffect(() => {
    let active = true;
    api<{ resources: ResourceCatalogItem[] }>("/resources/catalog", { auth: false })
      .then((data) => {
        if (active) setResources(data.resources);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => {
    const seen = new Set<string>();
    const list: ResourceTopic[] = [];
    for (const resource of resources) {
      const name = resource.domain || resource.category || "General";
      if (seen.has(name)) continue;
      seen.add(name);
      list.push({ name, slug: slugify(name) });
    }
    return list;
  }, [resources]);
}

export default function ResourcesCategoryMenu({
  triggerClassName,
  compact = false,
  showChevron = true,
  active = false,
  align = "left",
  placement = "down",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const topics = useResourceTopics();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-current={active ? "page" : undefined}
        aria-label={compact ? "Resources" : undefined}
        className={triggerClassName}
      >
        {compact ? (
          <LibraryBooks fontSize="small" aria-hidden />
        ) : (
          <>
            <span>Resources</span>
            {showChevron && (
              <ExpandMore
                fontSize="small"
                aria-hidden
                className={cn("transition-transform", open && "rotate-180")}
              />
            )}
          </>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 max-h-[70vh] w-[250px] overflow-y-auto border-t-4 border-brand-600 bg-paper text-ink shadow-elev3",
            placement === "up" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]",
            align === "right" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0",
          )}
        >
          {topics.length > 0 ? (
            <ul>
              {topics.map((topic) => (
                <li key={topic.slug}>
                  <Link
                    href={`/resources#${topic.slug}`}
                    onClick={() => setOpen(false)}
                    className="block w-full text-sm font-medium text-inherit transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <div className="mx-5 my-2.5 flex max-w-[170px] items-center justify-between">
                      <span>{topic.name}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-3 text-sm text-muted">No tutorials yet.</p>
          )}
          <Link
            href="/resources"
            onClick={() => setOpen(false)}
            className="block w-full border-t border-rule text-sm font-medium text-inherit transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <div className="mx-5 my-2.5 flex max-w-[170px] items-center justify-between">
              <span>All Tutorials</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
