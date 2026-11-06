// shared/lib: the pill styling shared by every day-picker in the app (features/filter-sessions'
// day strip, widgets/my-sessions-calendar's DayStrip) -- both render a weekday label over a
// day/date label in a selectable rounded pill, so this is the one place that shape is defined
// instead of two copy-pasted class strings drifting apart the next time either one is tweaked.
export const dayPillClassName =
  'flex h-13 w-16 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all active:scale-[0.96] md:w-22';
