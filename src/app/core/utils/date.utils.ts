/**
 * Returns a local-timezone ISO date string (YYYY-MM-DD) for the given Date.
 * Uses local date parts, not UTC, so it matches the user's calendar day.
 */
export function toLocalISO(d: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
