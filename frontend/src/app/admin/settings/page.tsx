"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface Setting {
  key: string;
  value: unknown;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const load = useCallback(() => {
    api<{ settings: Setting[] }>("/admin/settings")
      .then((d) => setSettings(d.settings))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, []);

  useEffect(load, [load]);

  async function save() {
    setError(null);
    try {
      const parsed: unknown = JSON.parse(value);
      await api("/admin/settings", { method: "PUT", body: JSON.stringify({ key, value: parsed }) });
      setKey("");
      setValue("");
      load();
    } catch (err) {
      setError(err instanceof SyntaxError ? "Value must be valid JSON" : err instanceof ApiError ? err.message : "Save failed");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Platform settings</h1>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-red-700">{error}</p>}

      <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Setting key (e.g. pricing.fullPlanPaise)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          placeholder='JSON value, e.g. {"amount": 49900}'
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
        />
        <button onClick={save} className="rounded-xl brand-grad px-5 py-2.5 font-semibold text-white hover:bg-brand-700">
          Save setting
        </button>
      </div>

      <ul className="mt-8 space-y-2">
        {settings.map((s) => (
          <li key={s.key} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-mono text-sm font-semibold text-slate-900">{s.key}</p>
            <pre className="mt-1 overflow-x-auto text-xs text-slate-600">{JSON.stringify(s.value, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
