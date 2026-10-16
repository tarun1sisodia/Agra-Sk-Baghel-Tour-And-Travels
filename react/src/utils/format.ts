export function formatInr(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function joinSitePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export function titleCaseSlug(slug: string): string {
  const small = ["to", "and", "or", "in", "on", "from", "of", "the", "a"];
  return slug
    .replaceAll("-", " ")
    .split(" ")
    .map((w, i) => (i > 0 && small.includes(w) ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}
