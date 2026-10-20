import type { Area, City } from '@shuttle-connect/types';

export const courtKeys = {
  all: ['courts'] as const,
  list: (city: City, area: Area) =>
    [...courtKeys.all, 'list', city, area] as const,
};
