/**
 * Firestore conversion utilities
 */

export function timestampToMs(v: unknown): number {
  if (typeof v === 'number') return v;
  const t = v as { toMillis?: () => number } | undefined;
  return t?.toMillis?.() ?? Date.now();
}
