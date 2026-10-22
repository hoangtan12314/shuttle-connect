// entities/user/ui: pick one of the 5 skill levels as numbered chips (onboarding, later the
// profile form). Built on Radix RadioGroup rather than ToggleGroup: it's a form field with exactly
// one value, so it should behave like radios -- arrow keys move the selection and screen readers
// announce "radio, 3 of 5". Bare numbers don't tell a new player much, so the chosen level's name
// and description appear under the scale.
import { RadioGroup } from 'radix-ui';
import { SkillLevel } from '@shuttle-connect/types';
import {
  skillLevelDescriptions,
  skillLevelNames,
  useLanguageStore,
} from '@/shared/i18n';
import { cn } from 'cn';

// Numeric enum -> Object.values() also yields the reverse-mapped names; keep only the numbers.
const LEVELS = Object.values(SkillLevel).filter(
  (value): value is SkillLevel => typeof value === 'number',
);

export function SkillLevelPicker({
  value,
  onChange,
  id,
  'aria-invalid': ariaInvalid,
}: {
  /** Undefined = nothing picked yet (no default on purpose: onboarding wants an active choice). */
  value?: SkillLevel;
  onChange: (level: SkillLevel) => void;
  id?: string;
  'aria-invalid'?: boolean;
}) {
  const language = useLanguageStore((state) => state.language);
  const first = LEVELS[0];
  const last = LEVELS[LEVELS.length - 1];

  return (
    <div className="flex flex-col gap-3">
      <RadioGroup.Root
        id={id}
        aria-invalid={ariaInvalid}
        value={value === undefined ? '' : String(value)}
        onValueChange={(next) => onChange(Number(next) as SkillLevel)}
        orientation="horizontal"
        className="flex gap-2"
      >
        {LEVELS.map((level) => (
          <RadioGroup.Item
            key={level}
            value={String(level)}
            aria-label={skillLevelNames[level][language]}
            className={cn(
              'h-12 flex-1 cursor-pointer rounded-full border text-base font-semibold transition-all outline-none active:scale-[0.96]',
              'hover:bg-muted focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              'data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground',
              ariaInvalid && 'border-destructive',
            )}
          >
            {level}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>

      {/* Scale: decorative -- the chips above carry the semantics. */}
      <div
        aria-hidden
        className="text-muted-foreground flex items-center gap-3 text-xs"
      >
        <span className="shrink-0">{skillLevelNames[first][language]}</span>
        <div className="relative flex flex-1 items-center justify-between">
          <div className="bg-border absolute inset-x-0 top-1/2 h-px -translate-y-1/2" />
          {LEVELS.map((level) => (
            <span
              key={level}
              className={cn(
                'relative size-2 rounded-full',
                level === value ? 'bg-accent size-2.5' : 'bg-border',
              )}
            />
          ))}
        </div>
        <span className="shrink-0">{skillLevelNames[last][language]}</span>
      </div>

      {value !== undefined && (
        <div className="bg-muted rounded-lg px-3 py-2 text-sm">
          <span className="font-semibold">
            {skillLevelNames[value][language]}
          </span>
          <span className="text-muted-foreground">
            {' — '}
            {skillLevelDescriptions[value][language]}
          </span>
        </div>
      )}
    </div>
  );
}
