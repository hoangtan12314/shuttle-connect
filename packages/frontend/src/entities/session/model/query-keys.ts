import type { Area, City } from '@shuttle-connect/types';

export const sessionKeys = {
  all: ['sessions'] as const,
  list: (city: City, area: Area) =>
    [...sessionKeys.all, 'list', city, area] as const,
  detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
  mine: () => [...sessionKeys.all, 'mine'] as const,
};
