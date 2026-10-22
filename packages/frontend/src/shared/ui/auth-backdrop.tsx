// shared/ui: decoration for the full-screen auth flow pages (the "Signing you in" callback and
// first-login onboarding), so both screens read as one flow. Purely visual: no business
// knowledge, which is why it sits in shared/ rather than in either page.
import { cn } from 'cn';

const blob = 'absolute rounded-full';

/** Soft corner blobs. `signin` puts them top-left + bottom-right (with one sweeping line);
 *  `onboarding` mirrors that (top-right + bottom-left), as in each screen's design. Sized down on
 *  phones so they never crowd the content. Place inside a `relative overflow-hidden` container. */
export function AuthBackdrop({
  variant = 'signin',
}: {
  variant?: 'signin' | 'onboarding';
}) {
  if (variant === 'onboarding') {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className={cn(
            blob,
            'bg-primary-100/60 -top-28 -right-24 size-56 md:-top-40 md:-right-32 md:size-96',
          )}
        />
        <div
          className={cn(
            blob,
            'bg-accent-100/70 -bottom-32 -left-20 size-56 md:-bottom-40 md:-left-24 md:size-96',
          )}
        />
        <div
          className={cn(
            blob,
            'bg-accent-200/50 -bottom-14 -left-10 size-32 md:-bottom-16 md:size-56',
          )}
        />
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className={cn(
          blob,
          'bg-accent-100/70 -top-24 -left-24 size-48 md:-top-32 md:-left-32 md:size-80',
        )}
      />
      <svg
        className="text-accent-300 absolute top-0 left-0 h-36 w-48 md:h-56 md:w-72"
        viewBox="0 0 288 224"
        fill="none"
      >
        <path
          d="M0 224C40 170 120 130 180 110C230 92 270 50 288 0"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      <div
        className={cn(
          blob,
          'bg-accent-100/70 -right-20 -bottom-32 size-56 md:-right-24 md:-bottom-40 md:size-96',
        )}
      />
      <div
        className={cn(
          blob,
          'bg-primary-100/60 -right-10 -bottom-14 size-40 md:-bottom-16 md:size-72',
        )}
      />
    </div>
  );
}

/** The horizontal logo for these pages. The PNG has an opaque near-white background, not
 *  transparency: mix-blend-darken keeps the darker of logo vs. backdrop per pixel, so the artwork
 *  stays and the box takes on the color behind it (a transparent export would make this
 *  unnecessary -- debt D14). */
export function AuthLogo({ className }: { className?: string }) {
  return (
    <img
      src="/shuttle-connect-logo-horizontal.png"
      alt="Shuttle Connect"
      className={cn(
        'relative h-9 w-auto mix-blend-darken md:h-11 dark:mix-blend-normal',
        className,
      )}
    />
  );
}
