"use client";

import { useId, useState } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Lock from "@mui/icons-material/Lock";
import Input from "@/components/ui/Input";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth";
import { cn } from "@/lib/cn";

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (!error && !hint) return null;
  return (
    <p
      id={id}
      className={cn("mt-1.5 text-sm", error ? "text-danger" : "text-slate-500")}
      role={error ? "alert" : undefined}
    >
      {error ?? hint}
    </p>
  );
}

export function TextField({
  label,
  error,
  hint,
  className,
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  const autoId = useId();
  const id = props.id ?? autoId;
  const describedBy = error || hint ? `${id}-msg` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink-900">
        {label}
      </label>
      {icon ? (
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400">
            {icon}
          </span>
          <Input id={id} error={Boolean(error)} aria-describedby={describedBy} className="pl-10" {...props} />
        </div>
      ) : (
        <Input id={id} error={Boolean(error)} aria-describedby={describedBy} className="mt-1.5" {...props} />
      )}
      <FieldMessage id={`${id}-msg`} error={error} hint={hint} />
    </div>
  );
}

export function PasswordField({
  label,
  value,
  error,
  hint,
  showRequirements,
  autoComplete = "current-password",
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value"> & {
  label: string;
  value: string;
  error?: string;
  hint?: string;
  showRequirements?: boolean;
}) {
  const autoId = useId();
  const id = props.id ?? autoId;
  const [visible, setVisible] = useState(false);
  const reqId = `${id}-req`;
  const describedBy = [error || hint ? `${id}-msg` : null, showRequirements ? reqId : null]
    .filter(Boolean)
    .join(" ");

  const longEnough = value.length >= PASSWORD_MIN_LENGTH;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-900">
        {label}
      </label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400">
          <Lock fontSize="small" />
        </span>
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          error={Boolean(error)}
          autoComplete={autoComplete}
          aria-describedby={describedBy || undefined}
          className="pl-10 pr-12"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-500 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
        >
          {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
        </button>
      </div>
      {showRequirements && (
        <ul id={reqId} className="mt-2 space-y-0.5 text-sm">
          <li className={longEnough ? "text-green-700" : "text-slate-500"}>
            {longEnough ? "\u2713" : "\u2022"} At least {PASSWORD_MIN_LENGTH} characters
            {longEnough ? "" : " (required)"}
          </li>
        </ul>
      )}
      <FieldMessage id={`${id}-msg`} error={error} hint={hint} />
    </div>
  );
}
