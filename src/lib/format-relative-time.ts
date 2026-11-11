const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_557_600_000],
  ["month", 2_629_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

export function formatRelativeTime(date: Date | string | number) {
  const diff = new Date(date).getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms) return formatter.format(Math.round(diff / ms), unit);
  }
  return "just now";
}
