// features/filter-sessions/model: zustand store -- last selected city/area persisted per browser
// (like shared/i18n's language store); day/time-of-day/price/level are session-only, reset on
// reload since they're about "right now", not a standing preference. Filtering itself happens
// client-side in the widget against whatever useSessions(city, area) already returned -- the API
// only supports city/area, not any of these.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Area, City, SkillLevel } from '@shuttle-connect/types';

// Matches the design's own buckets: am = before 11:00, pm = 11:00-17:00, eve = after 17:00.
export type TimeOfDay = 'all' | 'am' | 'pm' | 'eve';

// Discrete presets, not a free slider -- matches the design's own segmented price filter. 0 = no
// limit.
export const PRICE_PRESETS = [0, 80000, 100000, 120000] as const;

interface SessionFiltersState {
  city: City;
  area: Area;
  day: number | null; // 0-6 = that many days from today, null = any day
  timeOfDay: TimeOfDay;
  maxPrice: number; // 0 = no limit
  // Sessions a player at this level can join (session.minSkillLevel <= maxLevel); null = any.
  // Replaces the old "only my level" toggle -- picking your own level is the same filter.
  maxLevel: SkillLevel | null;
  query: string; // court-name search, matched client-side -- see matchesQuery in SessionBrowser
  setCity: (city: City) => void;
  setArea: (area: Area) => void;
  setDay: (day: number | null) => void;
  setTimeOfDay: (timeOfDay: TimeOfDay) => void;
  setMaxPrice: (maxPrice: number) => void;
  setMaxLevel: (maxLevel: SkillLevel | null) => void;
  setQuery: (query: string) => void;
  /** Commit several fields in one update -- the advanced sheet applies its whole draft at once. */
  apply: (draft: Partial<FilterDraft>) => void;
  clear: () => void;
}

/** The fields the advanced filter sheet edits as a local draft before "Apply". */
export type FilterDraft = Pick<
  SessionFiltersState,
  'area' | 'timeOfDay' | 'maxPrice' | 'maxLevel'
>;

const defaults = {
  day: null as number | null,
  timeOfDay: 'all' as TimeOfDay,
  maxPrice: 0,
  maxLevel: null as SkillLevel | null,
  query: '',
};

/** How many of the sheet-only/advanced filters differ from their defaults -- the badge count
 *  on the filter button. Area isn't counted: it always has a value, it's not a "filter on". */
export function countAdvanced(
  state: Pick<FilterDraft, 'timeOfDay' | 'maxPrice' | 'maxLevel'>,
): number {
  return (
    Number(state.timeOfDay !== defaults.timeOfDay) +
    Number(state.maxPrice !== defaults.maxPrice) +
    Number(state.maxLevel !== defaults.maxLevel)
  );
}

export const DRAFT_DEFAULTS: Omit<FilterDraft, 'area'> = {
  timeOfDay: defaults.timeOfDay,
  maxPrice: defaults.maxPrice,
  maxLevel: defaults.maxLevel,
};

export const useSessionFilters = create<SessionFiltersState>()(
  persist(
    (set) => ({
      city: City.HO_CHI_MINH,
      area: Area.HCM_DISTRICT_10,
      ...defaults,
      setCity: (city) => set({ city }),
      setArea: (area) => set({ area }),
      setDay: (day) => set({ day }),
      setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
      setMaxPrice: (maxPrice) => set({ maxPrice }),
      setMaxLevel: (maxLevel) => set({ maxLevel }),
      setQuery: (query) => set({ query }),
      apply: (draft) => set(draft),
      clear: () => set({ ...defaults }),
    }),
    {
      name: 'shuttle-connect-session-filters',
      partialize: (state) => ({ city: state.city, area: state.area }),
    },
  ),
);
