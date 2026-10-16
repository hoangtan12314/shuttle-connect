// features/filter-sessions/ui: district select + 7-day strip + time-of-day segmented control +
// max-price segmented control + "only my level" toggle, driven by the model/use-session-filters
// store. Price/level filtering needs SessionOverview's priceMale/priceFemale/minSkillLevel, which
// only exist as of the server's SessionMapper.toOverview fix -- see the plan doc's Phase 2
// deviation note for the backstory.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { Toggle } from '@/shared/ui/toggle';
import { Button } from '@/shared/ui/button';
import { Area, SkillLevel } from '@shuttle-connect/types';
import { useT, useLanguageStore, areaNames } from '@/shared/i18n';
import { formatDayStrip, areasForCity } from '@/shared/lib';
import {
  useSessionFilters,
  PRICE_PRESETS,
  type TimeOfDay,
} from '../model/use-session-filters';
import { cn } from 'cn';

const next7Days = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);
  return date;
});

export function SessionFilters({ myLevel }: { myLevel?: SkillLevel }) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);
  const {
    city,
    area,
    day,
    timeOfDay,
    maxPrice,
    fitOnly,
    setArea,
    setDay,
    setTimeOfDay,
    setMaxPrice,
    setFitOnly,
    clear,
  } = useSessionFilters();

  const isFiltered =
    day !== null || timeOfDay !== 'all' || maxPrice !== 0 || fitOnly;

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

        <ToggleGroup
          type="single"
          value={String(maxPrice)}
          onValueChange={(value) => value && setMaxPrice(Number(value))}
        >
          {PRICE_PRESETS.map((price) => (
            <ToggleGroupItem key={price} value={String(price)}>
              {price === 0 ? t.anyPrice : `≤ ${price / 1000}k`}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Toggle
          variant="outline"
          pressed={fitOnly}
          disabled={myLevel === undefined}
          onPressedChange={setFitOnly}
        >
          {t.fitOnlyL}
        </Toggle>

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
