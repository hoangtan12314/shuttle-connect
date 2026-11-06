import { MySessionsCalendar } from '@/widgets/my-sessions-calendar';
import { useT } from '@/shared/i18n';

export function ActivityPage() {
  const t = useT();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t.activityT}</h1>
        <p className="text-muted-foreground">{t.mySessionsB}</p>
      </div>
      <MySessionsCalendar />
    </div>
  );
}
