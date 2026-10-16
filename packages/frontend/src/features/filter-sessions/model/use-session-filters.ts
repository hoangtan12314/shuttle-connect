// features/filter-sessions/model: zustand store -- last selected city/area persisted per browser
// (like shared/i18n's language store); day/time-of-day are session-only, reset on reload since
// they're about "right now", not a standing preference. Filtering itself happens client-side in
// the widget against whatever useSessions(city, area) already returned -- the API only supports
// city/area, not day or time-of-day, so those two narrow the same result set in the browser.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Area, City } from '@shuttle-connect/types';

// Matches the design's own buckets: am = before 11:00, pm = 11:00-17:00, eve = after 17:00.
export type TimeOfDay = 'all' | 'am' | 'pm' | 'eve';

interface SessionFiltersState {
  city: City;
  area: Area;
  day: number | null; // 0-6 = that many days from today, null = any day
  timeOfDay: TimeOfDay;
  setCity: (city: City) => void;
  setArea: (area: Area) => void;
  setDay: (day: number | null) => void;
  setTimeOfDay: (timeOfDay: TimeOfDay) => void;
  clear: () => void;
}

const defaults = {
  day: null as number | null,
  timeOfDay: 'all' as TimeOfDay,
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
      clear: () => set({ ...defaults }),
    }),
    {
      name: 'shuttle-connect-session-filters',
      partialize: (state) => ({ city: state.city, area: state.area }),
    },
  ),
);
