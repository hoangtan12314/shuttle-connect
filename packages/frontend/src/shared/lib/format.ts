// shared/lib: formatting helpers that depend on the active language, but aren't translated
// strings themselves (that's shared/i18n) -- number/date formatting rules.
import type { Language } from '@/shared/i18n';

const localeFor: Record<Language, string> = { vi: 'vi-VN', en: 'en-US' };

/** e.g. formatPrice(90000, 'vi') -> "90.000 ₫" */
export function formatPrice(amountVnd: number, language: Language): string {
  return new Intl.NumberFormat(localeFor[language], {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amountVnd);
}

/** Short weekday + day-of-month for the browse page's 7-day strip, e.g. "Thu" / "17". Never
 *  hardcode weekday names -- Intl.DateTimeFormat already knows them per locale. */
export function formatDayStrip(
  date: Date,
  language: Language,
): { weekday: string; day: string } {
  const locale = localeFor[language];
  return {
    weekday: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date),
    day: new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(date),
  };
}

/** e.g. formatDateTime('2026-10-17T18:00:00.000Z', 'en') -> "Sat, Oct 17, 6:00 PM". Session
 *  timestamps are full ISO 8601 strings (see ListSessionsByDistrictDto's @IsISO8601()), not bare
 *  "HH:mm" -- for a single timestamp, e.g. SessionOverview's startTime (the browse list doesn't
 *  get endTime at all, only SessionItemResponse -- the single-session detail shape -- does). */
export function formatDateTime(isoString: string, language: Language): string {
  return new Intl.DateTimeFormat(localeFor[language], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoString));
}

/** e.g. formatTimeRange('2026-10-17T18:00:00.000Z', '2026-10-17T20:00:00.000Z', 'en')
 *  -> "6:00 PM - 8:00 PM". For SessionItemResponse (has both startTime/endTime, unlike the
 *  browse list's SessionOverview) -- the session-detail page, not the browse card. */
export function formatTimeRange(
  startTime: string,
  endTime: string,
  language: Language,
): string {
  const timeFmt = new Intl.DateTimeFormat(localeFor[language], {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${timeFmt.format(new Date(startTime))} - ${timeFmt.format(new Date(endTime))}`;
}

/** e.g. formatRelativeMinutes(41) -> "41 min ago" / "41 phút trước". */
export function formatRelativeMinutes(
  minutesAgo: number,
  language: Language,
): string {
  const rtf = new Intl.RelativeTimeFormat(localeFor[language], {
    numeric: 'always',
  });
  if (minutesAgo < 60) return rtf.format(-minutesAgo, 'minute');
  if (minutesAgo < 60 * 24)
    return rtf.format(-Math.round(minutesAgo / 60), 'hour');
  return rtf.format(-Math.round(minutesAgo / (60 * 24)), 'day');
}
