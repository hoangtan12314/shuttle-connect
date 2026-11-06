// Replaced the earlier week-paged model (prev/next arrows moving 7 days at a time) with one
// continuous scrollable list starting from today -- the paging model meant the selected day
// could be scrolled out of the visible 7-pill window with no visual cue, so "where am I" wasn't
// answerable without scrolling. A single list plus DayStrip auto-scrolling the selected pill
// into view removes that ambiguity entirely.
//
// 90 days is a generous, simply-bounded window rather than true virtualization/infinite scroll
// -- both /sessions/mine and /requests/mine only ever return upcoming sessions, and nothing in
// this app lets a session be created more than a few months out, so this comfortably covers any
// real session without the complexity of loading more days on demand.
const VISIBLE_DAYS = 90;

export function upcomingDays(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: VISIBLE_DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
}
