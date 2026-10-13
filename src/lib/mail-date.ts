const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
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
];

// how mail labels a message: the time today, then Yesterday, then the weekday for
// the past week, then the date. formatted by hand because Intl's spacing before
// AM/PM differs between node versions
export function mailDate(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days === 0) {
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
  }
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return DAYS[date.getDay()];
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

// round() above absorbs the hour lost or gained across daylight saving
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
