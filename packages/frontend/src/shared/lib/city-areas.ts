// shared/lib: which Area values belong to a City. Derived from the enum values themselves
// (Area members are prefixed with their City's own value, e.g. City.HO_CHI_MINH = "HCM" and
// Area.HCM_DISTRICT_1 = "HCM_DISTRICT_1") rather than hand-maintained, so a new district added to
// the Area enum shows up here automatically.
import { Area, City } from '@shuttle-connect/types';

export function areasForCity(city: City): Area[] {
  return Object.values(Area).filter((area) => area.startsWith(`${city}_`));
}
