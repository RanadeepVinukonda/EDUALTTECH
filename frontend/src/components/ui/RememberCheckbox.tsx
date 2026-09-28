"use client";

export default function RememberCheckbox({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer select-none items-center gap-2">
      <span className="relative inline-flex h-5 w-5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <svg viewBox="0 0 64 64" className="h-5 w-5 overflow-visible" aria-hidden="true">
          <path
            d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
            pathLength={575.0541381835938}
            className="path fill-none stroke-slate-300 [stroke-dasharray:241_9999999] [stroke-dashoffset:0] transition-all duration-500 ease-in-out peer-checked:stroke-brand-600 peer-checked:[stroke-dasharray:70.5096664428711_9999999] peer-checked:[stroke-dashoffset:-262.2723388671875]"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}