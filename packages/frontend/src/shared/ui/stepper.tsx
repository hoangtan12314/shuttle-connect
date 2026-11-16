import { Minus, Plus } from 'lucide-react';
import { cn } from 'cn';

const buttonClass =
  'flex size-11 cursor-pointer items-center justify-center transition-colors outline-none hover:bg-neutral-200 focus-visible:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

// A − value + control for small integer counts (total slots, already-filled slots), where typing a
// number into an <input type="number"> is clumsier than tapping.
function Stepper({
  value,
  onChange,
  min = 0,
  max,
  decrementLabel,
  incrementLabel,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  decrementLabel: string;
  incrementLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-card flex w-fit items-stretch overflow-hidden rounded-xl border',
        className,
      )}
    >
      <button
        type="button"
        aria-label={decrementLabel}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={buttonClass}
      >
        <Minus className="size-5" />
      </button>
      <span className="flex min-w-12 items-center justify-center text-xl font-extrabold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label={incrementLabel}
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(value + 1)}
        className={buttonClass}
      >
        <Plus className="size-5" />
      </button>
    </div>
  );
}

export { Stepper };
