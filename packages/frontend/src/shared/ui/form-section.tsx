import type { ReactNode } from 'react';

// A numbered section of a long form ("01  Court", "02  Time"...), the layout the hosting screens
// use. The number is purely visual orientation, so it's aria-hidden.
function FormSection({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2.5">
        <span
          aria-hidden
          className="text-primary-700 text-sm font-extrabold tabular-nums"
        >
          {String(index).padStart(2, '0')}
        </span>
        <h2 className="text-lg font-extrabold">{title}</h2>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export { FormSection };
