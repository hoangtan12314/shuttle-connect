import type { ReactNode } from 'react';
import { Link, useCanGoBack, useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { cn } from 'cn';
import { useT } from '@/shared/i18n';
import { Button } from './button';

// Back button (mobile only -- desktop has the browser's own back and the sidebar) + page title +
// an optional trailing action. History-back when there is history; a deep link straight to the
// page (no history) falls back to the home page instead of a dead button.
function PageHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  const t = useT();
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="md:hidden">
        {canGoBack ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t.back}
            onClick={() => router.history.back()}
          >
            <ArrowLeft />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" aria-label={t.back} asChild>
            <Link to="/">
              <ArrowLeft />
            </Link>
          </Button>
        )}
      </span>
      <h1 className="mr-auto text-lg font-extrabold md:text-2xl">{title}</h1>
      {action}
    </div>
  );
}

export { PageHeader };
