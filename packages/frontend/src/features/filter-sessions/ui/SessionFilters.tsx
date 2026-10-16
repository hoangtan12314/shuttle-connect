// features/filter-sessions/ui: district select + 7-day strip + time-of-day segmented control,
// driven by the model/use-session-filters store. Max-price and "only my level" from the design
// aren't implemented -- SessionOverview (the browse list's response shape) carries neither a
// price nor a minSkillLevel field, only SessionItemResponse (the single-session detail shape)
// would, so there's nothing to filter on yet without a backend change.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { Button } from '@/shared/ui/button';
import { Area } from '@shuttle-connect/types';
import { useT, useLanguageStore, areaNames } from '@/shared/i18n';
import { formatDayStrip, areasForCity } from '@/shared/lib';
import {
  useSessionFilters,
  type TimeOfDay,
} from '../model/use-session-filters';
import { cn } from 'cn';

const next7Days = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);
  return date;
});

export function SessionFilters() {
  const t = useT();
  const language = useLanguageStore((state) => state.language);
  const { city, area, day, timeOfDay, setArea, setDay, setTimeOfDay, clear } =
    useSessionFilters();

  const isFiltered = day !== null || timeOfDay !== 'all';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={area} onValueChange={(value) => setArea(value as Area)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {areasForCity(city).map((a) => (
              <SelectItem key={a} value={a}>
                {areaNames[a][language]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ToggleGroup
          type="single"
          value={timeOfDay}
          onValueChange={(value) => value && setTimeOfDay(value as TimeOfDay)}
        >
          <ToggleGroupItem value="all">{t.todAll}</ToggleGroupItem>
          <ToggleGroupItem value="am">{t.todAm}</ToggleGroupItem>
          <ToggleGroupItem value="pm">{t.todPm}</ToggleGroupItem>
          <ToggleGroupItem value="eve">{t.todEve}</ToggleGroupItem>
        </ToggleGroup>

        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={clear}>
            {t.clear}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setDay(null)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            day === null
              ? 'border-primary bg-primary text-primary-foreground'
              : 'hover:bg-muted',
          )}
        >
          {t.anyDay}
        </button>
        {next7Days.map((date, i) => {
          const { weekday, day: dayOfMonth } = formatDayStrip(date, language);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setDay(i)}
              className={cn(
                'flex flex-col items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                day === i
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
              )}
            >
              <span>{weekday}</span>
              <span>{dayOfMonth}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
