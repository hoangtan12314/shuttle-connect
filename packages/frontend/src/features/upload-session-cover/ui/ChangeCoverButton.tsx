// features/upload-session-cover/ui: "Change photo" for an existing session (edit page). Picks
// a file and uploads it immediately; errors toast through the global MutationCache handler.
import { useId } from 'react';
import { toast } from 'sonner';
import { ImagePlus } from 'lucide-react';
import { buttonVariants } from '@/shared/ui/button';
import { useT } from '@/shared/i18n';
import { cn } from 'cn';
import { useUploadSessionCover } from '../api/use-upload-session-cover';
import { COVER_ACCEPT } from './CoverPhotoInput';

export function ChangeCoverButton({ sessionId }: { sessionId: string }) {
  const t = useT();
  const inputId = useId();
  const { mutate, isPending } = useUploadSessionCover();

  return (
    <>
      <label
        htmlFor={inputId}
        aria-disabled={isPending}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'cursor-pointer',
          isPending && 'pointer-events-none opacity-50',
        )}
      >
        <ImagePlus />
        {isPending ? t.coverUploading : t.coverChange}
      </label>
      <input
        id={inputId}
        type="file"
        accept={COVER_ACCEPT}
        className="sr-only"
        disabled={isPending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) {
            mutate(
              { sessionId, file },
              { onSuccess: () => toast.success(t.coverUploaded) },
            );
          }
        }}
      />
    </>
  );
}
