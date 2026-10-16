// features/filter-sessions/model: zustand store -- last selected city/area persisted per browser
// (like shared/i18n's language store); day/time-of-day/price/fitOnly are session-only, reset on
// reload since they're about "right now", not a standing preference. Filtering itself happens
// client-side in the widget against whatever useSessions(city, area) already returned -- the API
// only supports city/area, not any of these.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Area, City } from '@shuttle-connect/types';

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
  fitOnly: boolean; // only sessions the viewer's own level meets
  setCity: (city: City) => void;
  setArea: (area: Area) => void;
  setDay: (day: number | null) => void;
  setTimeOfDay: (timeOfDay: TimeOfDay) => void;
  setMaxPrice: (maxPrice: number) => void;
  setFitOnly: (fitOnly: boolean) => void;
  clear: () => void;
}

const defaults = {
  day: null as number | null,
  timeOfDay: 'all' as TimeOfDay,
  maxPrice: 0,
  fitOnly: false,
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
      setFitOnly: (fitOnly) => set({ fitOnly }),
      clear: () => set({ ...defaults }),
    }),
    {
      name: 'shuttle-connect-session-filters',
      partialize: (state) => ({ city: state.city, area: state.area }),
    },
  ),
);
