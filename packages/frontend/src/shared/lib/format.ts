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

/** Compact price for tight spots (cards, filter chips): thousands as "k", the way prices are
 *  written informally in Vietnam -- formatPriceShort(60000, 'vi') -> "60k", 65500 -> "65,5k"
 *  ("65.5k" in English). Under 1,000 (including free, 0) falls back to the full currency format,
 *  since "0k" reads oddly. */
export function formatPriceShort(
  amountVnd: number,
  language: Language,
): string {
  if (amountVnd < 1000) return formatPrice(amountVnd, language);
  const thousands = new Intl.NumberFormat(localeFor[language], {
    maximumFractionDigits: 1,
  }).format(amountVnd / 1000);
  return `${thousands}k`;
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

// Index = Date.getDay() (0 = Sunday). Vietnamese uses its own compact convention ("T4" = thứ tư),
// which Intl doesn't produce -- vi-VN's short weekday is "Th 4".
const VI_WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Compact weekday for the day strip: "T4" / "CN" in Vietnamese, "Wed" in English. */
export function formatWeekdayShort(date: Date, language: Language): string {
  if (language === 'vi') return VI_WEEKDAY_SHORT[date.getDay()];
  return new Intl.DateTimeFormat(localeFor[language], {
    weekday: 'short',
  }).format(date);
}

/** e.g. formatDateTime('2026-10-17T18:00:00.000Z', 'en') -> "Sat, Oct 17, 6:00 PM". Session
 *  timestamps are full ISO 8601 strings (see ListSessionsByDistrictDto's @IsISO8601()), not bare
 *  "HH:mm" -- for a single timestamp where there's no end time to show alongside it (e.g. a
 *  notification or activity row). For a session card/list item, prefer formatSessionWindow
 *  below -- SessionOverview carries endTime too, not just startTime. */
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
 *  -> "6:00 PM - 8:00 PM". Time only, no date -- for a context that already shows the date
 *  separately (e.g. next to a day-strip selection). For a session card/list item showing both
 *  date and time range in one line, prefer formatSessionWindow below. */
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

/** e.g. formatSessionWindow('2026-10-17T18:00:00.000Z', '2026-10-17T20:00:00.000Z', 'en')
 *  -> "Sat, Oct 17, 6:00 PM - 8:00 PM". Date once, both times -- the browse/activity card format,
 *  now that SessionOverview carries endTime (see SessionMapper.toOverview). */
export function formatSessionWindow(
  startTime: string,
  endTime: string,
  language: Language,
): string {
  const locale = localeFor[language];
  const dateFmt = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeFmt = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const start = new Date(startTime);
  return `${dateFmt.format(start)}, ${timeFmt.format(start)} - ${timeFmt.format(new Date(endTime))}`;
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
