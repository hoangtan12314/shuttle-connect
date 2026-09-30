import { Area, City } from '@shuttle-connect/types';

// `location` is the only place attribute persisted on an item -- `city` and `district` are derived
// from it on read. It is a plain display/lookup fact, separate from the GSI1 index key (see
// `index-keys.ts`): GSI1PK is derived from the same city/district but prefixed by entity type
// (`SLOC#`/`CLOC#`), so a session and a court in the same district land in separate partitions of
// one shared index rather than `location` itself being the partition key.
export const toLocationKey = (city: City, district: Area): string => `${city}#${district}`;

// Split on the first `#` only: Area values contain `_` but never `#`, so this is unambiguous.
export const fromLocationKey = (value: string): { city: City; district: Area } => {
  const separator = value.indexOf('#');
  return {
    city: value.slice(0, separator) as City,
    district: value.slice(separator + 1) as Area,
  };
};
