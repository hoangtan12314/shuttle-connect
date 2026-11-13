// features/upload-session-cover/ui: optional photo picker with a preview, controlled by the
// caller (the create-session page keeps the File until the session exists, then uploads it).
import { useEffect, useId, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useT } from '@/shared/i18n';

export const COVER_ACCEPT = 'image/jpeg,image/png,image/webp';

export function CoverPhotoInput({
  value,
  onChange,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
}) {
  const t = useT();
  const inputId = useId();
  // Not useMemo: its factory isn't guaranteed to run exactly once per committed value (Strict
  // Mode double-invokes it in dev specifically to catch impure code like createObjectURL), so the
  // first of those two calls would leak with no way to revoke it. setState called directly in the
  // render body, guarded by a condition that only holds when `value` actually changed -- not
  // inside a useEffect (react-hooks/set-state-in-effect disallows that here) and not a ref
  // read/write during render (react-hooks/refs disallows that too) -- this is React's own
  // documented "store info from a previous render" pattern, the same shape
  // MySessionsCalendar's jumpedTabs already uses in this codebase. On the double-render, `value`
  // already matches `cached.file` by the second pass, so createObjectURL only actually runs once
  // per real file change.
  const [cached, setCached] = useState<{ file: File; url: string } | null>(
    null,
  );
  if (cached?.file !== value) {
    if (cached) URL.revokeObjectURL(cached.url);
    setCached(value ? { file: value, url: URL.createObjectURL(value) } : null);
  }
  const previewUrl = cached?.url ?? null;
  // The guard above revokes the *previous* URL whenever a new render sees a different file; this
  // only handles the one case it can't -- the final URL still held when the component unmounts.
  useEffect(() => {
    return () => {
      if (cached) URL.revokeObjectURL(cached.url);
    };
  }, [cached]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{t.coverL}</span>
      {value && previewUrl ? (
        <div className="relative overflow-hidden rounded-xl">
          <img
            src={previewUrl}
            alt=""
            className="aspect-[5/2] w-full object-cover"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={t.coverRemove}
            onClick={() => onChange(null)}
            className="absolute top-2 right-2"
          >
            <X />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="text-muted-foreground hover:bg-muted flex aspect-[5/2] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm"
        >
          <ImagePlus className="size-6" />
          {t.coverPick}
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept={COVER_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          e.target.value = ''; // so picking the same file again still fires onChange
        }}
      />
      <p className="text-muted-foreground text-xs">{t.coverHint}</p>
    </div>
  );
}
