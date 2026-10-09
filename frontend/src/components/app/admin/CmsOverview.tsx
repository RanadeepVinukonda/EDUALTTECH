"use client";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { MediaAssetRow, OrganizationRow, ProgramRow, TeamMemberRow, WorkItemRow } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import ErrorState from "@/components/ui/ErrorState";
import { AdminHeader, Panel, Skeleton, StatusPill, useAsync } from "./admin-ui";

const SECTIONS = [
  { href: "/dashboard/admin/cms/work", label: "Work & Projects", desc: "Portfolio entries shown on the public Our Work page." },
  { href: "/dashboard/admin/cms/partners", label: "Partners & Organizations", desc: "Schools, partners, and collaborators listed publicly." },
  { href: "/dashboard/admin/cms/programs", label: "Programs", desc: "Educational programs and initiatives on the Services page." },
  { href: "/dashboard/admin/cms/team", label: "Team", desc: "People profiles displayed on the public Team page." },
  { href: "/dashboard/admin/cms/media", label: "Media Library", desc: "Reusable images and assets referenced across the site." },
] as const;

export default function CmsOverview() {
  const work = useAsync(() => apiGet<{ items: WorkItemRow[] }>("/cms/admin/work"), []);
  const orgs = useAsync(() => apiGet<{ items: OrganizationRow[] }>("/cms/admin/organizations"), []);
  const programs = useAsync(() => apiGet<{ items: ProgramRow[] }>("/cms/admin/programs"), []);
  const team = useAsync(() => apiGet<{ items: TeamMemberRow[] }>("/cms/admin/team"), []);
  const media = useAsync(() => apiGet<{ assets: MediaAssetRow[] }>("/cms/admin/media"), []);
  const all = [work, orgs, programs, team, media];
  const loading = all.every((r) => r.loading && !r.data);
  const failed = all.every((r) => r.error);

  const counts = {
    work: summarize(work.data?.items ?? []),
    partners: summarize(orgs.data?.items ?? []),
    programs: summarize(programs.data?.items ?? []),
    team: summarize(team.data?.items ?? []),
    media: media.data?.assets.length ?? 0,
  };

  const recent = buildRecent(work.data?.items, orgs.data?.items, programs.data?.items, team.data?.items);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="CMS"
        description="Manage the content shown on EduAltTech’s public website. Every section reads and writes through the backend; nothing here is stored in the browser."
        actions={
          <Link href="/dashboard/admin/cms/media" className="text-sm font-semibold text-brand-700 hover:underline">
            Media Library →
          </Link>
        }
      />

      {failed ? (
        <ErrorState message="Could not load CMS content." onRetry={() => all.forEach((r) => r.reload())} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SectionCard {...SECTIONS[0]} count={counts.work} />
            <SectionCard {...SECTIONS[1]} count={counts.partners} />
            <SectionCard {...SECTIONS[2]} count={counts.programs} />
            <SectionCard {...SECTIONS[3]} count={counts.team} />
            <SectionCard {...SECTIONS[4]} count={counts.media} noun="asset" />
          </div>

          <Panel title="Recently updated" description="The latest edits across content types that track an update time. Media assets track creation only.">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : recent.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {recent.map((r) => (
                  <li key={`${r.kind}:${r.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span className="min-w-0">
                      <Link href={r.href} className="font-semibold text-ink-900 hover:text-brand-700">
                        {r.title}
                      </Link>
                      <span className="ml-2 text-xs text-slate-500">{r.kind}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <StatusPill tone={r.published ? "success" : "warn"}>{r.published ? "published" : "draft"}</StatusPill>
                      <span className="text-xs text-slate-500">{formatDate(r.updatedAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">Nothing published or drafted yet.</p>
            )}
          </Panel>

          <Panel title="Quick actions">
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/admin/cms/work" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50">
                Add a work item
              </Link>
              <Link href="/dashboard/admin/cms/partners" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50">
                Add a partner
              </Link>
              <Link href="/dashboard/admin/cms/programs" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50">
                Add a program
              </Link>
              <Link href="/dashboard/admin/cms/team" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50">
                Add a team member
              </Link>
            </div>
          </Panel>

          <Panel title="Not supported by the backend">
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-500">
              <li>Direct file upload for media — assets are registered by URL; only avatars are uploaded (from account settings).</li>
              <li>Media reference tracking — cover and logo URLs are stored as plain strings, so deletion impact cannot be enumerated.</li>
              <li>Manual ordering for work, partners, and programs — these are sorted by the server.</li>
              <li>Program dates, categories, and enrolment links — not part of the program model.</li>
            </ul>
          </Panel>
        </>
      )}
    </div>
  );
}

function summarize(items: { isPublished: boolean }[]) {
  const published = items.filter((i) => i.isPublished).length;
  return { total: items.length, published, draft: items.length - published };
}

function SectionCard({
  href,
  label,
  desc,
  count,
  noun = "item",
}: {
  href: string;
  label: string;
  desc: string;
  count: { total: number; published: number; draft: number } | number;
  noun?: string;
}) {
  const isNum = typeof count === "number";
  return (
    <Link href={href} className="block rounded-[20px] border border-slate-200 bg-white p-5 shadow-elev1 transition hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40">
      <p className="font-display text-lg font-bold text-ink-900">{label}</p>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
      {isNum ? (
        <p className="mt-3 text-sm text-slate-600">
          {count} {noun}
          {count === 1 ? "" : "s"} registered
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          {count.total} total · {count.published} published · {count.draft} draft
        </p>
      )}
    </Link>
  );
}

function buildRecent(
  work: WorkItemRow[] | undefined,
  orgs: OrganizationRow[] | undefined,
  programs: ProgramRow[] | undefined,
  team: TeamMemberRow[] | undefined,
) {
  const rows: { id: string; kind: string; title: string; href: string; published: boolean; updatedAt: string }[] = [];
  for (const w of work ?? [])
    rows.push({ id: w.id, kind: "Work", title: w.title, href: "/dashboard/admin/cms/work", published: w.isPublished, updatedAt: w.updatedAt });
  for (const o of orgs ?? [])
    rows.push({ id: o.id, kind: "Partner", title: o.name, href: "/dashboard/admin/cms/partners", published: o.isPublished, updatedAt: o.updatedAt });
  for (const p of programs ?? [])
    rows.push({ id: p.id, kind: "Program", title: p.title, href: "/dashboard/admin/cms/programs", published: p.isPublished, updatedAt: p.updatedAt });
  for (const t of team ?? [])
    rows.push({ id: t.id, kind: "Team", title: t.name, href: "/dashboard/admin/cms/team", published: t.isPublished, updatedAt: t.updatedAt });
  return rows.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 6);
}
