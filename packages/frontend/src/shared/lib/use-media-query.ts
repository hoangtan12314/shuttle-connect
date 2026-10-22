// shared/lib: subscribe to a CSS media query from React. For the rare case a breakpoint has to
// change a *prop*, not just a class -- e.g. a Sheet's `side` (bottom on phones, right on desktop),
// which Tailwind's responsive variants can't reach. useSyncExternalStore keeps it tear-free and
// re-renders only when the match actually flips.
import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
