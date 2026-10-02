"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export interface ActivityRow {
  day: string;
  kind: string;
  count: number;
}

const KINDS = [
  { key: "lesson", label: "Lessons", color: "var(--color-brand-600)" },
  { key: "practice", label: "Practice", color: "var(--color-brand-400)" },
  { key: "quiz", label: "Quizzes", color: "var(--color-ink-700)" },
] as const;

const DAYS = 30;

/**
 * Fills the 30-day window with real zero days — the API only stores rows for
 * days that had activity, so gaps are common.
 */
function series(rows: ActivityRow[]) {
  const byDay = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const day = r.day.slice(0, 10);
    byDay.set(day, { ...byDay.get(day), [r.kind]: (byDay.get(day)?.[r.kind] ?? 0) + r.count });
  }
  const out: Record<string, string | number>[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const hit = byDay.get(key) ?? {};
    out.push({ day: key, ...Object.fromEntries(KINDS.map((k) => [k.key, hit[k.key] ?? 0])) });
  }
  return out;
}

export default function ActivityTrend({ activity }: { activity: ActivityRow[] }) {
  const data = series(activity);
  const total = data.reduce((sum, d) => sum + KINDS.reduce((s, k) => s + (d[k.key] as number), 0), 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-elev2 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-slate-900">Learning activity</h2>
        <p className="text-sm text-slate-500">Last {DAYS} days</p>
      </div>

      {total === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          No lessons, practice or quizzes logged in the last {DAYS} days.
        </p>
      ) : (
        <>
          <div className="mt-4 h-[200px] w-full">
            <BarChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="#eef2f0" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v: string) => v.slice(5).replace("-", "/")}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={40}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              {KINDS.map((k, i) => (
                <Bar
                  key={k.key}
                  dataKey={k.key}
                  stackId="a"
                  fill={k.color}
                  radius={i === KINDS.length - 1 ? [4, 4, 0, 0] : 0}
                />
              ))}
            </BarChart>
          </div>

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
            {KINDS.map((k) => (
              <li key={k.key} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ background: k.color }} />
                {k.label}
              </li>
            ))}
          </ul>

          <p className="sr-only">
            {KINDS.map((k) => `${k.label}: ${data.reduce((s, d) => s + (d[k.key] as number), 0)}`).join(", ")} over the
            last {DAYS} days.
          </p>
        </>
      )}
    </section>
  );
}
