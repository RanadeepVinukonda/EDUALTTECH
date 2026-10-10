"use client";

import { useRef, useState } from "react";
import { apiPost } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { notifyError, notifySuccess } from "@/lib/notify";
import Button from "@/components/ui/Button";

const MAX_BYTES = 2 * 1024 * 1024;

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "?";
}

export default function AvatarUploader({ avatarUrl, firstName, lastName }: { avatarUrl: string | null; firstName: string; lastName: string }) {
  const { refresh } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notifyError("Choose an image file (PNG or JPG).");
      return;
    }
    if (file.size > MAX_BYTES) {
      notifyError("Image is too large — keep it under 2 MB.");
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
      await apiPost<{ avatarUrl: string }>("/auth/avatar", { name: file.name, type: file.type, data });
      await refresh();
      notifySuccess("Profile photo updated.");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Could not upload the photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
      ) : (
        <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-50 font-display text-xl font-bold text-brand-700">
          {initials(firstName, lastName)}
        </span>
      )}
      <div>
        <label className="sr-only" htmlFor="avatar-file">
          Profile photo (PNG or JPG, up to 2 MB)
        </label>
        <input ref={inputRef} id="avatar-file" type="file" accept="image/*" className="sr-only" onChange={onPick} />
        <Button type="button" variant="secondary" size="sm" loading={busy} onClick={() => inputRef.current?.click()}>
          {avatarUrl ? "Change photo" : "Upload photo"}
        </Button>
        <p className="mt-2 text-xs text-slate-500">PNG or JPG, up to 2 MB.</p>
      </div>
    </div>
  );
}
