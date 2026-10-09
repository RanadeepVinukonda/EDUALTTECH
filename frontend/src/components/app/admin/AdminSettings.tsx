"use client";

import { useEffect, useState } from "react";
import { api, apiGet, ApiError } from "@/lib/api";
import type { SettingsMap } from "@/lib/app-types";
import { notifySuccess, notifyError } from "@/lib/notify";
import ErrorState from "@/components/ui/ErrorState";
import Button from "@/components/ui/Button";
import { AdminHeader, Panel, Skeleton, useAsync } from "./admin-ui";

const MIN = 1;
const MAX = 1000;

export default function AdminSettings() {
  const settings = useAsync(() => apiGet<SettingsMap>("/admin/settings"), []);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.data && value === "") setValue(String(settings.data.mentor_capacity ?? ""));
  }, [settings.data, value]);

  const parsed = Number(value);
  const invalid = !Number.isInteger(parsed) || parsed < MIN || parsed > MAX;
  const dirty = settings.data ? String(settings.data.mentor_capacity ?? "") !== value : false;

  async function save() {
    if (invalid || !dirty) return;
    setSaving(true);
    try {
      const res = await api<{ current: number }>("/admin/settings", { method: "PUT", body: { key: "mentor_capacity", value: parsed } });
      notifySuccess("Settings saved");
      setValue(String(res.current));
      settings.reload();
    } catch (e) {
      notifyError(e instanceof ApiError ? e.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Settings"
        description="Platform settings backed by the database. Environment variables and secrets are not exposed here."
      />

      {settings.error ? (
        <ErrorState message={settings.error} onRetry={settings.reload} />
      ) : settings.loading && !settings.data ? (
        <Skeleton className="h-40 rounded-[20px]" />
      ) : (
        <Panel
          title="Mentor capacity"
          description="Default number of learners each mentor can be assigned when a course-specific capacity is not set. Enforced server-side during mentor seat selection."
        >
          <div className="max-w-sm space-y-2">
            <label htmlFor="mentor-capacity" className="text-sm font-semibold text-ink-900">
              Default seats per mentor
            </label>
            <input
              id="mentor-capacity"
              type="number"
              min={MIN}
              max={MAX}
              step={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            {invalid && value !== "" && (
              <p className="text-xs text-red-700">Enter a whole number between {MIN} and {MAX}.</p>
            )}
            <div className="flex gap-2 pt-1">
              <Button size="sm" disabled={invalid || !dirty} loading={saving} onClick={save}>
                Save
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!dirty || saving}
                onClick={() => setValue(String(settings.data?.mentor_capacity ?? ""))}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Panel>
      )}

      <p className="text-sm text-slate-500">
        The backend whitelists editable settings; currently only <span className="font-mono">mentor_capacity</span> is
        writable. Payment keys, email credentials, and other configuration live in server environment variables and are
        not editable from the browser.
      </p>
    </div>
  );
}
