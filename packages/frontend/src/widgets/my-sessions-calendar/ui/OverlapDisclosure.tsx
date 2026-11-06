import { Layers, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { useT } from '@/shared/i18n';
import type { MySessionEvent } from '../lib/to-calendar-events';
import { SessionEventCard } from './SessionEventCard';

// The small "N sessions at this time -> View details" link from the reference mock
// (sample-ui-images/"ShuttleConnect Overlapping Sessions Dashboard.png"), sitting below the
// cluster's primary card. Clicking it opens a dialog listing every session in the cluster --
// each one still the same SessionEventCard, just stacked full-width instead of squeezed into a
// narrow FullCalendar lane, which is the whole point of clustering in the first place.
export function OverlapDisclosure({ cluster }: { cluster: MySessionEvent[] }) {
  const t = useT();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center gap-1.5 px-1 text-xs"
        >
          <Layers className="size-3 shrink-0" />
          <span className="truncate">
            {cluster.length} {t.overlapCountL}
          </span>
          <span className="inline-flex shrink-0 items-center gap-0.5 font-medium underline-offset-2 hover:underline">
            {t.viewDetailsL}
            <ArrowRight className="size-3" />
          </span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.overlapTitle}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {cluster.map((event) => (
            <SessionEventCard key={event.id} event={event} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
