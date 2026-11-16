// entities/session/ui: one rounded block per total slot, filled for each slot still remaining.
// aria-hidden since the adjacent text line (e.g. "2 of 4 slots left") already carries the
// meaning -- this is a visual reinforcement, not independent information.
export function SlotMeter({
  slotsTotal,
  slotsRemaining,
}: {
  slotsTotal: number;
  slotsRemaining: number;
}) {
  return (
    <div aria-hidden className="flex flex-wrap gap-1">
      {Array.from({ length: slotsTotal }, (_, i) => (
        <span
          key={i}
          className={`h-7 w-5 rounded-sm ${
            i < slotsRemaining ? 'bg-primary' : 'bg-neutral-300'
          }`}
        />
      ))}
    </div>
  );
}
