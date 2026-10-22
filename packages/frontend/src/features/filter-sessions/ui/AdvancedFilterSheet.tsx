// features/filter-sessions/ui: "Bộ lọc nâng cao" -- bottom sheet on phones, right-side sheet on
// desktop. Edits a local DRAFT, not the store: tapping chips here doesn't re-filter the list behind
// the sheet, and only "Apply" commits (one store update). Cancel / swipe / overlay-click just drop
// the draft. "Reset" resets the draft to defaults but still waits for Apply -- so a user can reset,
// look, and back out. Area is reset-exempt for the same reason clear() keeps it: it's a standing
// preference ("where I play"), not a one-off filter.
import { useState } from 'react';
import { Area, SkillLevel } from '@shuttle-connect/types';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { Button } from '@/shared/ui/button';
import {
  useT,
  useLanguageStore,
  areaNames,
  skillLevelNames,
} from '@/shared/i18n';
import { areasForCity, formatPriceShort, useMediaQuery } from '@/shared/lib';
import { MapPin } from 'lucide-react';
import {
  useSessionFilters,
  PRICE_PRESETS,
  DRAFT_DEFAULTS,
  type FilterDraft,
  type TimeOfDay,
} from '../model/use-session-filters';

// Numeric enum -> Object.values() also yields the reverse-mapped names; keep only the numbers.
const LEVELS = Object.values(SkillLevel).filter(
  (value): value is SkillLevel => typeof value === 'number',
);

const chipClass = 'rounded-full px-4';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

// Mounted only while the sheet is open (Radix unmounts closed content), so the useState
// initializer re-reads the store on every open -- no effect needed to "sync" the draft.
function AdvancedFilterBody({
  myLevel,
  onDone,
}: {
  myLevel?: SkillLevel;
  onDone: () => void;
}) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);
  const { city, area, timeOfDay, maxPrice, maxLevel, apply } =
    useSessionFilters();
  const [draft, setDraft] = useState<FilterDraft>({
    area,
    timeOfDay,
    maxPrice,
    maxLevel,
  });
  const update = (patch: Partial<FilterDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  return (
    <>
      <SheetHeader className="flex-row items-center justify-between pb-0">
        <SheetTitle className="text-lg">{t.advFilterT}</SheetTitle>
        <SheetDescription className="sr-only">{t.advFilterT}</SheetDescription>
        <Button
          variant="link"
          className="h-auto p-0"
          onClick={() => update(DRAFT_DEFAULTS)}
        >
          {t.resetL}
        </Button>
      </SheetHeader>

      <div className="flex flex-col gap-5 overflow-y-auto px-4">
        <Section title={t.areaLabel}>
          <Select
            value={draft.area}
            onValueChange={(value) => update({ area: value as Area })}
          >
            <SelectTrigger className="w-full">
              <MapPin />
              <span className="flex-1 text-left">
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {areasForCity(city).map((a) => (
                <SelectItem key={a} value={a}>
                  {areaNames[a][language]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Section>

        <Section title={t.timeFilterL}>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={2}
            className="flex-wrap"
            value={draft.timeOfDay}
            onValueChange={(value) =>
              value && update({ timeOfDay: value as TimeOfDay })
            }
          >
            <ToggleGroupItem value="all" className={chipClass}>
              {t.todAll}
            </ToggleGroupItem>
            <ToggleGroupItem value="am" className={chipClass}>
              {t.todAm}
            </ToggleGroupItem>
            <ToggleGroupItem value="pm" className={chipClass}>
              {t.todPm}
            </ToggleGroupItem>
            <ToggleGroupItem value="eve" className={chipClass}>
              {t.todEve}
            </ToggleGroupItem>
          </ToggleGroup>
        </Section>

        <Section title={t.priceFilterL}>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={2}
            className="flex-wrap"
            value={String(draft.maxPrice)}
            onValueChange={(value) =>
              value && update({ maxPrice: Number(value) })
            }
          >
            {PRICE_PRESETS.map((price) => (
              <ToggleGroupItem
                key={price}
                value={String(price)}
                className={chipClass}
              >
                {price === 0
                  ? t.anyPrice
                  : `≤ ${formatPriceShort(price, language)}`}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Section>

        <Section title={t.levelFilterL}>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={2}
            className="flex-wrap"
            value={draft.maxLevel === null ? 'all' : String(draft.maxLevel)}
            onValueChange={(value) =>
              value &&
              update({
                maxLevel:
                  value === 'all' ? null : (Number(value) as SkillLevel),
              })
            }
          >
            <ToggleGroupItem value="all" className={chipClass}>
              {t.anyLevel}
            </ToggleGroupItem>
            {LEVELS.map((level) => (
              <ToggleGroupItem
                key={level}
                value={String(level)}
                className={chipClass}
              >
                {skillLevelNames[level][language]}
                {level === myLevel && (
                  <span className="opacity-70">({t.youL})</span>
                )}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Section>
      </div>

      <SheetFooter>
        <Button
          size="lg"
          onClick={() => {
            apply(draft);
            onDone();
          }}
        >
          {t.applyL}
        </Button>
        <Button size="lg" variant="ghost" onClick={onDone}>
          {t.cancelL}
        </Button>
      </SheetFooter>
    </>
  );
}

export function AdvancedFilterSheet({
  open,
  onOpenChange,
  myLevel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myLevel?: SkillLevel;
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        showCloseButton={false}
        className={
          isDesktop ? 'sm:max-w-md' : 'max-h-[85vh] rounded-t-2xl pt-2'
        }
      >
        {!isDesktop && (
          <div
            aria-hidden
            className="bg-muted-foreground/30 mx-auto h-1 w-10 rounded-full"
          />
        )}
        <AdvancedFilterBody
          myLevel={myLevel}
          onDone={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
