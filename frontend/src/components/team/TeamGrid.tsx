"use client";

import { useState } from "react";
import { TEAM } from "./team";

function MemberCard({ name, file }: { name: string; file: string }) {
  const [imgOk, setImgOk] = useState(true);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

  return (
    <div className="flex flex-col items-center text-center">
      {imgOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/team/${file}`}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setImgOk(false)}
          className="h-24 w-24 rounded-full object-cover ring-2 ring-brand-100"
        />
      ) : (
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100 font-display text-2xl font-black text-brand-700 ring-2 ring-brand-200">
          {initials}
        </span>
      )}
      <p className="mt-3 font-display text-sm font-bold text-ink-700">{name}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">Edu-Alt-Tech</p>
    </div>
  );
}

export default function TeamGrid({ limit }: { limit?: number }) {
  const members = limit ? TEAM.slice(0, limit) : TEAM;
  return (
    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5">
      {members.map((m) => (
        <MemberCard key={m.file} name={m.name} file={m.file} />
      ))}
    </div>
  );
}