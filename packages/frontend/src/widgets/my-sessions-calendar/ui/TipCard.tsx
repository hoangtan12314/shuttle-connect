import { Link } from '@tanstack/react-router';
import { Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { useT } from '@/shared/i18n';

// The mock's Tip card links to a map ("near you"), which doesn't exist yet -- points at Browse
// instead (see the plan's "Not doing" list).
export function TipCard() {
  const t = useT();

  return (
    <Link to="/">
      <Card className="hover:border-primary/40 transition-colors">
        <CardContent className="flex items-start gap-3">
          <Lightbulb className="text-accent size-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t.tipT}</p>
            <p className="text-muted-foreground text-xs">{t.tipB}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
