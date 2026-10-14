import { mailDate } from "#/lib/mail-date";
import { useHydrated } from "@tanstack/react-router";

// dates depend on the visitor's clock, timezone and locale, which the server
// doesn't know, so they only appear once the page is running in the browser
export function MailTime({ iso, full = false }: { iso: string; full?: boolean }) {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return (
    <time dateTime={iso}>
      {full ? new Date(iso).toLocaleString() : mailDate(iso)}
    </time>
  );
}
