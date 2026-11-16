import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from 'cn';
import { StickyBar } from '@/shared/ui/sticky-bar';

// widgets/session-detail/ui: the sticky bottom bar on the redesigned detail page -- replaces
// StatusCallout (deleted), which centered the same content as its own standalone card instead
// of anchoring it to the bottom of the page the way the design does.
const toneClasses = {
  primary: 'bg-primary-100 text-primary-700',
  neutral: 'bg-neutral-100 text-neutral-700',
  destructive: 'bg-destructive/10 text-destructive',
} as const;

export function DetailActionBar({
  icon: Icon,
  title,
  body,
  tone = 'neutral',
  note,
  children,
}: {
  icon?: LucideIcon;
  title?: string;
  body?: string;
  tone?: keyof typeof toneClasses;
  note?: string;
  children?: ReactNode;
}) {
  const hasStatus = !!Icon && !!title;
  if (!hasStatus && !note && !children) return null;

  return (
    <StickyBar>
      {hasStatus && Icon && (
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex size-10 flex-none items-center justify-center rounded-xl',
              toneClasses[tone],
            )}
          >
            <Icon className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-base leading-tight font-extrabold">
              {title}
            </span>
            {body && (
              <span className="text-muted-foreground text-sm">{body}</span>
            )}
          </div>
        </div>
      )}
      {children}
      {note && (
        <p className="text-muted-foreground text-center text-xs">{note}</p>
      )}
    </StickyBar>
  );
}
