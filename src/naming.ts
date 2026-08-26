const FALLBACK_SLUG = "explainer";
const MAX_SLUG_LENGTH = 60;

// a-z0-9- only. This is also the security boundary: the topic comes from the
// model, and "../../.bashrc" would otherwise escape the output directory.
export function slugify(topic: string): string {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
  return slug || FALLBACK_SLUG;
}

export function dateStamp(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Explaining the same topic twice in one day must not overwrite the first
// explainer — it may still be open in a browser tab.
export function fileName(topic: string, date: Date, existing: readonly string[]): string {
  const base = `${dateStamp(date)}-${slugify(topic)}`;
  const taken = new Set(existing);
  if (!taken.has(`${base}.html`)) return `${base}.html`;
  for (let n = 2; ; n += 1) {
    const candidate = `${base}-${n}.html`;
    if (!taken.has(candidate)) return candidate;
  }
}
