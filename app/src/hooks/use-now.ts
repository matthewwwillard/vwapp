import { useEffect, useState } from "react";

/** Current epoch ms, refreshed every `intervalMs` — keeps relative-time labels from going stale. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);
    return () => {
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}

/** Relative-time label for a `useNow` tick: "just now", "5m ago", "3h ago", "2d ago". */
export function agoLabel(epochMs: number, now: number): string {
  const mins = Math.max(0, Math.round((now - epochMs) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${String(mins)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${String(hours)}h ago`;
  return `${String(Math.round(hours / 24))}d ago`;
}
