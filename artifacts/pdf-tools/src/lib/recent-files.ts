export interface RecentFile {
  name: string;
  tool: string;
  toolPath: string;
  timestamp: number;
  size: number;
}

const KEY = "pdftools-recent";
const MAX = 6;

export function addRecentFile(entry: RecentFile) {
  const existing = getRecentFiles().filter(
    (f) => !(f.name === entry.name && f.toolPath === entry.toolPath)
  );
  const updated = [entry, ...existing].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export function getRecentFiles(): RecentFile[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearRecentFiles() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
