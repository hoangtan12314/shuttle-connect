import * as React from 'react';
import { cn } from 'cn';

// A whole-number money input with the dong sign pinned at the right. Spreads every prop onto the
// inner <input>, so react-hook-form's <FormControl> (which injects id/aria-*) and `field.ref`
// land on the real element.
function PriceInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <span
      className={cn(
        'bg-card focus-within:border-ring focus-within:ring-ring/50 flex items-center overflow-hidden rounded-xl border focus-within:ring-[3px]',
        className,
      )}
    >
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={1000}
        className="min-h-12 min-w-0 flex-1 bg-transparent px-3 text-lg font-extrabold outline-none"
        {...props}
      />
      <span aria-hidden className="px-3 font-extrabold">
        ₫
      </span>
    </span>
  );
}

export { PriceInput };
