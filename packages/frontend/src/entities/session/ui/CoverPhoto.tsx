// entities/session/ui: a session's cover photo, or a stand-in when the host hasn't uploaded one.
// The stand-in is a deterministic gradient + a faint court-line pattern keyed off the court id
// (not a random color), so the same court looks the same across reloads. The gradient also sits
// behind a real photo while it loads, so the card never flashes an empty box.
import { useState } from 'react';
import { courtPlaceholderGradient } from '@/shared/lib';

export function CoverPhoto({
  courtId,
  imageUrl,
  className,
  children,
}: {
  courtId: string;
  /** The session's coverUrl. null/undefined, or a URL that fails to load, shows the gradient. */
  imageUrl?: string | null;
  className?: string;
  /** Badges to overlay on top of the photo (e.g. district/availability), absolutely positioned
   *  by the caller -- this component only owns the `relative` container they position against. */
  children?: React.ReactNode;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = imageUrl && imageUrl !== failedUrl;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${courtPlaceholderGradient(courtId)} ${className ?? ''}`}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(imageUrl)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          {/* Faint sideline/net lines, just enough to read as "a court" rather than a flat swatch. */}
          <div
            aria-hidden
            className="absolute inset-3 rounded-sm border border-white/25"
          />
          <div
            aria-hidden
            className="absolute top-3 bottom-3 left-1/2 w-px -translate-x-1/2 bg-white/25"
          />
        </>
      )}
      {children}
    </div>
  );
}
