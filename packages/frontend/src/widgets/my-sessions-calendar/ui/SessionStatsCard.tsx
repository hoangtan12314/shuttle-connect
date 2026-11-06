import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useT } from '@/shared/i18n';

// Always both counts, regardless of which tab is active -- matches the mock, which keeps this
// card's two numbers static while the tabs above it filter the calendar.
export function SessionStatsCard({
  joinedCount,
  hostedCount,
}: {
  joinedCount: number;
  hostedCount: number;
}) {
  const t = useT();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="size-4" />
          {t.statsT}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex gap-6">
        <div>
          <p className="text-2xl font-bold">{joinedCount}</p>
          <p className="text-muted-foreground text-xs">{t.statJoined}</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{hostedCount}</p>
          <p className="text-muted-foreground text-xs">{t.statHosted}</p>
        </div>
      </CardContent>
    </Card>
  );
}
