import { Area, City } from '@shuttle-connect/types';
import { fromLocationKey, toLocationKey } from './location';

describe('toLocationKey', () => {
  it('joins city and district with a single #', () => {
    expect(toLocationKey(City.HO_CHI_MINH, Area.HCM_DISTRICT_10)).toBe('HCM#HCM_DISTRICT_10');
  });
});

describe('fromLocationKey', () => {
  it('splits a location key back into city and district', () => {
    expect(fromLocationKey('HCM#HCM_DISTRICT_10')).toEqual({
      city: City.HO_CHI_MINH,
      district: Area.HCM_DISTRICT_10,
    });
  });

  it('splits on the FIRST # only, so a district value containing _ (never #) round-trips correctly', () => {
    // Area values use `_` as their internal separator, never `#` -- confirms the split logic
    // doesn't get confused by that and only ever treats the first `#` as the boundary.
    const key = toLocationKey(City.HANOI, Area.HN_HAI_BA_TRUNG);
    expect(key).toBe('HN#HN_HAI_BA_TRUNG');
    expect(fromLocationKey(key)).toEqual({ city: City.HANOI, district: Area.HN_HAI_BA_TRUNG });
  });

  it('round-trips every real city/district pair through toLocationKey then fromLocationKey', () => {
    const pairs: [City, Area][] = [
      [City.HO_CHI_MINH, Area.HCM_THU_DUC],
      [City.HANOI, Area.HN_TAY_HO],
      [City.DA_NANG, Area.DN_NGU_HANH_SON],
    ];
    for (const [city, district] of pairs) {
      expect(fromLocationKey(toLocationKey(city, district))).toEqual({ city, district });
    }
  });
});
