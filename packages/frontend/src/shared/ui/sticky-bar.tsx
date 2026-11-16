import * as React from 'react';
import { cn } from 'cn';

// A bar pinned to the bottom of the page while its content scrolls (session detail's actions, the
// create/edit forms' submit). `bottom-16` (not `bottom-0`) on mobile: the page scrolls as a whole
// and AppShell's tab bar is `fixed` on top of it, so `sticky bottom-0` would stick flush to the
// real viewport bottom, underneath the tab bar. 64px matches `main`'s own `pb-16` reserved gutter
// and clears the ~53px tab bar. No tab bar on desktop, so `md:bottom-0`.
function StickyBar({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sticky-bar"
      className={cn(
        'bg-background sticky bottom-16 z-10 flex flex-col gap-2.5 rounded-t-xl p-4 shadow-lg md:bottom-0',
        className,
      )}
      {...props}
    />
  );
}

export { StickyBar };
