export function initials(first: string, last: string): string {
  const value = `${first.charAt(0)}${last.charAt(0)}`.trim().toUpperCase();
  return value || "?";
}

export function initialsFromName(name: string): string {
  const value = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return value || "?";
}
