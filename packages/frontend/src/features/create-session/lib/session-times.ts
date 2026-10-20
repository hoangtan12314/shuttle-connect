// features/create-session/lib: start/end-time helpers for the create form.
// MAX_SESSION_HOURS is shared with the server (Session.validateTimeSlot enforces it for real);
// this file re-exports it so existing imports of `MAX_SESSION_HOURS` from here keep working.
import { MAX_SESSION_HOURS } from '@shuttle-connect/types';

export { MAX_SESSION_HOURS };
export const SUGGESTED_SESSION_HOURS = 2;

const HOUR_MS = 60 * 60 * 1000;
export const MAX_SESSION_DURATION_MS = MAX_SESSION_HOURS * HOUR_MS;

// <input type="datetime-local"> takes local wall-clock time ("2026-10-20T18:00"), not
// toISOString()'s UTC -- in Vietnam (UTC+7) that would show a time 7 hours off.
export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

// Always strictly after `now` (17:00:20 -> 18:00, not 17:00), so the default can't already be in
// the past by the time the user submits and trip the schema's start-in-the-future rule.
export function nextFullHour(now: Date = new Date()): Date {
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
}

// Returns '' for an empty or partially typed value, so callers can skip the suggestion.
export function addHoursToDateTimeLocal(value: string, hours: number): string {
  const date = new Date(value); // no offset in the string -> parsed as local time
  if (Number.isNaN(date.getTime())) return '';
  return toDateTimeLocalValue(new Date(date.getTime() + hours * HOUR_MS));
}
