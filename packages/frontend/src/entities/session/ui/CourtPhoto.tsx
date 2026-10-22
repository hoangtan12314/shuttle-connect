// entities/session/ui: stand-in for a real court photo (none exist yet -- see the UI-refactor
// plan's Phase B for the S3 upload pipeline). A deterministic gradient + a faint court-line
// pattern, not a random color, so the same court looks the same across reloads. Internal to this
// slice's ui segment, not re-exported from index.ts -- only SessionCard uses it.
import { courtPlaceholderGradient } from '@/shared/lib';

export function CourtPhoto({
  courtId,
  className,
  children,
}: {
  courtId: string;
  className?: string;
  /** Badges to overlay on top of the photo (e.g. district/availability), absolutely positioned
   *  by the caller -- this component only owns the `relative` container they position against. */
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${courtPlaceholderGradient(courtId)} ${className ?? ''}`}
    >
      {/* Faint sideline/net lines, just enough to read as "a court" rather than a flat swatch. */}
      <div
        aria-hidden
        className="absolute inset-3 rounded-sm border border-white/25"
      />
      <div
        aria-hidden
        className="absolute top-3 bottom-3 left-1/2 w-px -translate-x-1/2 bg-white/25"
      />
      {children}
    </div>
  );
}
