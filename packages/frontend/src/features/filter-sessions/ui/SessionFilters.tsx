// features/filter-sessions/ui: the browse page's filter bar, driven by the
// model/use-session-filters store. Two densities from one component:
// - mobile: district + match count + search/filter icon buttons, then one sideways-scrolling row
//   of icon-less time chips + a price *summary* chip, then the day strip. Price and level live
//   in the AdvancedFilterSheet (bottom sheet) to keep the list itself on screen.
// - desktop (md+): everything inline with icons, plus the same sheet (right side) for level.
// Price/level filtering needs SessionOverview's priceMale/priceFemale/minSkillLevel, which only
// exist as of the server's SessionMapper.toOverview fix.
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Area, SkillLevel } from '@shuttle-connect/types';
import { useT, useLanguageStore, areaNames } from '@/shared/i18n';
import {
  formatDayStrip,
  formatWeekdayShort,
  formatPriceShort,
  areasForCity,
} from '@/shared/lib';
import {
  useSessionFilters,
  PRICE_PRESETS,
  countAdvanced,
  type TimeOfDay,
} from '../model/use-session-filters';
import { AdvancedFilterSheet } from './AdvancedFilterSheet';
import { cn } from 'cn';
import {
  MapPin,
  CalendarDays,
  Sun,
  Sunset,
  Moon,
  Coins,
  Search,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';

const next7Days = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);
  return date;
});

// Icons only earn their space on desktop; on a phone the label alone is enough.
const chipIcon = 'max-md:hidden';
const dayPill =
  'flex h-13 w-16 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all active:scale-[0.96] md:w-22';

export function SessionFilters({
  myLevel,
  courtNames = [],
  matchCount,
}: {
  myLevel?: SkillLevel;
  /** Distinct court names from the sessions currently loaded, offered as a <datalist> for the
   *  search box -- "Chọn hoặc nhập tên sân" (pick or type), not a strict autocomplete. */
  courtNames?: string[];
  /** Sessions left after filtering -- the "12 buổi phù hợp" pill. Omit while loading. */
  matchCount?: number;
}) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);
  const {
    city,
    area,
    day,
    timeOfDay,
    maxPrice,
    maxLevel,
    query,
    setArea,
    setDay,
    setTimeOfDay,
    setMaxPrice,
    setQuery,
    clear,
  } = useSessionFilters();
  const [sheetOpen, setSheetOpen] = useState(false);
  // Mobile only -- desktop always shows the input inline. Starts open if a query is already set,
  // so a search typed earlier isn't silently hiding results behind a collapsed box.
  const [searchOpen, setSearchOpen] = useState(query !== '');

  const advancedCount = countAdvanced({ timeOfDay, maxPrice, maxLevel });
  const isFiltered = day !== null || advancedCount > 0 || query !== '';

  const searchInput = (
    <div className="relative">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        list="court-name-options"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.searchCourtPh}
        aria-label={t.searchL}
        className="pl-8"
      />
    </div>
  );

  return (
    <div className="bg-card flex flex-col gap-3 rounded-xl border p-3 shadow-sm md:p-4">
      {/* Shared by both search inputs (desktop inline + mobile toggle), so it's rendered once --
          two <datalist>s with the same id would be invalid HTML. */}
      <datalist id="court-name-options">
        {courtNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {/* Row 1: where + how many + actions. Every item but the action buttons must be able to
          shrink (min-w-0 + truncation): if this row's content is wider than a small phone, it
          overflows the page, and mobile browsers then widen the whole layout viewport -- which
          also pushes the fixed bottom nav off-screen. */}
      <div className="flex min-w-0 items-center gap-2">
        <Select value={area} onValueChange={(value) => setArea(value as Area)}>
          <SelectTrigger className="w-auto shrink-0 md:w-[180px]">
            <MapPin className="text-muted-foreground" />
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

        {matchCount !== undefined && (
          <Badge
            variant="accent"
            className="min-w-0 shrink px-2.5 py-1"
            title={`${matchCount} ${t.matchCountL}`}
          >
            <span className="truncate">
              {matchCount} {t.matchCountL}
            </span>
          </Badge>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <div className="hidden w-72 md:block">{searchInput}</div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={t.searchL}
            aria-pressed={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <Search className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={t.filterL}
            onClick={() => setSheetOpen(true)}
          >
            <SlidersHorizontal className="size-5" />
            {advancedCount > 0 && (
              <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold">
                {advancedCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {searchOpen && <div className="md:hidden">{searchInput}</div>}

      {/* Row 2: quick chips -- one sideways-scrolling line on mobile, wrapping on desktop */}
      <div className="-mx-3 flex [scrollbar-width:none] items-center gap-3 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
        <ToggleGroup
          type="single"
          value={timeOfDay}
          onValueChange={(value) => value && setTimeOfDay(value as TimeOfDay)}
        >
          <ToggleGroupItem value="all">
            <CalendarDays className={chipIcon} /> {t.todAll}
          </ToggleGroupItem>
          <ToggleGroupItem value="am">
            <Sun className={chipIcon} /> {t.todAm}
          </ToggleGroupItem>
          <ToggleGroupItem value="pm">
            <Sunset className={chipIcon} /> {t.todPm}
          </ToggleGroupItem>
          <ToggleGroupItem value="eve">
            <Moon className={chipIcon} /> {t.todEve}
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Mobile: one summary chip that opens the sheet, instead of four price chips. */}
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full md:hidden"
          onClick={() => setSheetOpen(true)}
        >
          {maxPrice === 0
            ? t.priceFilterL
            : `≤ ${formatPriceShort(maxPrice, language)}`}
          <ChevronRight />
        </Button>

        <ToggleGroup
          type="single"
          className="max-md:hidden"
          value={String(maxPrice)}
          onValueChange={(value) => value && setMaxPrice(Number(value))}
        >
          {PRICE_PRESETS.map((price, i) => (
            <ToggleGroupItem key={price} value={String(price)}>
              {i === 0 && <Coins />}
              {price === 0
                ? t.anyPrice
                : `≤ ${formatPriceShort(price, language)}`}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={clear}
          >
            {t.clear}
          </Button>
        )}
      </div>

      {/* Row 3: day strip */}
      <div className="-mx-3 flex [scrollbar-width:none] items-center gap-1.5 overflow-x-auto px-3 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setDay(null)}
          className={cn(
            dayPill,
            day === null
              ? 'border-primary bg-primary text-primary-foreground'
              : 'hover:bg-muted',
          )}
        >
          {t.anyDay}
        </button>
        {next7Days.map((date, i) => {
          const { day: dayOfMonth } = formatDayStrip(date, language);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setDay(i)}
              className={cn(
                dayPill,
                day === i
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
              )}
            >
              <span>
                {i === 0 ? t.today : formatWeekdayShort(date, language)}
              </span>
              <span>{dayOfMonth}</span>
            </button>
          );
        })}
      </div>

      <AdvancedFilterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        myLevel={myLevel}
      />
    </div>
  );
}
