export function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

export function formatYearRange(start: number, end: number): string {
  if (start === end) return formatYear(start);
  return `${formatYear(start)} – ${formatYear(end)}`;
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatYearMonth(year: number, month: number): string {
  const safeMonth = Math.min(12, Math.max(1, month));
  return `${MONTH_SHORT[safeMonth - 1]} ${formatYear(year)}`;
}

export function formatMilestonePercents(milestones: number[]) {
  if (milestones.length === 0) return "";
  if (milestones.length <= 8) {
    return milestones.map((m) => `${m}%`).join(", ");
  }
  return `${milestones[0]}% through ${milestones[milestones.length - 1]}% (${milestones.length} milestones)`;
}
