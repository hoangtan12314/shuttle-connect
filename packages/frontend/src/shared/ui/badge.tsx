import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { Slot } from 'radix-ui';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90',
        outline:
          'border-border text-foreground [a&]:hover:bg-muted [a&]:hover:text-foreground',
        ghost: '[a&]:hover:bg-muted [a&]:hover:text-foreground',
        link: 'text-primary underline-offset-4 [a&]:hover:underline',
        // Tag color set (bg-100/text-800 pairs off the ramps in index.css) -- status pills
        // (SessionStatusBadge, RequestStatusBadge) pick one of these, not `default`. `accent`
        // (teal) is for genuinely small, deliberate highlights per the 60/30/10 note in
        // index.css -- don't reach for it as a default status color; `primary`/`neutral` cover
        // most cases.
        primary: 'bg-primary-100 text-primary-800',
        accent: 'bg-accent-100 text-accent-800',
        neutral: 'bg-neutral-100 text-neutral-800',
        'primary-outline': 'border-primary bg-transparent text-primary',
        // Semantic, not palette-named (see index.css's success/warning tokens), and solid like
        // `destructive` rather than a pale tint -- status/level tags that need to actually stand
        // out (open & available, a skill-level tier), including sitting on top of a photo.
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
