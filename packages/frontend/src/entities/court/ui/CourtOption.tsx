import type { CourtItemOverview } from '@shuttle-connect/types';
import { SelectItem } from '@/shared/ui/select';

// entities/court/ui: CourtOption -- one choice in a court picker (features/create-session's
// district -> court select). Address alongside the name since court names alone aren't always
// distinguishing (e.g. multiple branches of the same club). The address is a `description`, so
// the closed trigger shows only the name.
export function CourtOption({ court }: { court: CourtItemOverview }) {
  return (
    <SelectItem value={court.id} description={court.address}>
      {court.name}
    </SelectItem>
  );
}
