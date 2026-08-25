const FALLBACK_SLUG = "explainer";
const MAX_SLUG_LENGTH = 60;

// 只留 a-z0-9-。這同時是安全邊界:主題字串來自模型,若原樣拼進路徑,
// "../../.bashrc" 這種東西就會寫到輸出目錄外面去。
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

// 同一天講同一個主題兩次不該互相覆蓋——舊那份可能還開著。
export function fileName(topic: string, date: Date, existing: readonly string[]): string {
  const base = `${dateStamp(date)}-${slugify(topic)}`;
  const taken = new Set(existing);
  if (!taken.has(`${base}.html`)) return `${base}.html`;
  for (let n = 2; ; n += 1) {
    const candidate = `${base}-${n}.html`;
    if (!taken.has(candidate)) return candidate;
  }
}
