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

/** e.g. formatTimeRange('18:00', '20:00') -> "18:00 - 20:00". Session start/end times are plain
 *  "HH:mm" strings (see @shuttle-connect/types), not Date objects -- no timezone conversion
 *  applies here, so no Intl needed, just a fixed separator. */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
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
