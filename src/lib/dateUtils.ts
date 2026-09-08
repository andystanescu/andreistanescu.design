export function todayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function dateInputValue(value: string | undefined) {
  if (!value) return todayInputValue();
  const iso = value.match(/^\d{4}-\d{2}-\d{2}$/);
  if (iso) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? todayInputValue() : parsed.toISOString().slice(0, 10);
}

export function displayDate(value: string) {
  const parsed = new Date(`${dateInputValue(value)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function displayMonthYear(value: string) {
  const parsed = new Date(`${dateInputValue(value)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
