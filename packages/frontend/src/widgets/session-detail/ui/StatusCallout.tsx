import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { cn } from 'cn';

// A persistent page-section status block (not a transient toast/banner), so tones stay in the
// same restrained set SessionStatusBadge/SessionCard already use -- no `accent`, that color is
// reserved for small, genuinely occasional highlights per index.css's 60/30/10 note, not a whole
// card section.
const toneClasses = {
  primary: 'bg-primary-100 text-primary-700',
  neutral: 'bg-neutral-100 text-neutral-700',
  destructive: 'bg-destructive/10 text-destructive',
} as const;

export function StatusCallout({
  icon: Icon,
  title,
  body,
  tone = 'neutral',
  children,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  tone?: keyof typeof toneClasses;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-full',
            toneClasses[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          {body && (
            <p className="text-muted-foreground max-w-sm text-sm">{body}</p>
          )}
        </div>
        {children && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
