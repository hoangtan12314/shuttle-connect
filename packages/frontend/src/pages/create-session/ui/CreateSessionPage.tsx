import { useState } from 'react';
import { CreateSessionForm } from '@/features/create-session';
import {
  CoverPhotoInput,
  useUploadSessionCover,
} from '@/features/upload-session-cover';
import { PageHeader } from '@/shared/ui/page-header';
import { useT } from '@/shared/i18n';

// pages/create-session: composes features/create-session (the form) with
// features/upload-session-cover (the optional photo). The photo can only be uploaded once the
// session exists -- the server checks the uploader is that session's host -- so the File is held
// here and uploaded from the form's onCreated hook.
export function CreateSessionPage() {
  const t = useT();
  const [cover, setCover] = useState<File | null>(null);
  const { mutateAsync: uploadCover } = useUploadSessionCover();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <PageHeader title={t.newSessionT} />
      <CreateSessionForm
        coverField={<CoverPhotoInput value={cover} onChange={setCover} />}
        onCreated={
          cover
            ? (session) => uploadCover({ sessionId: session.id, file: cover })
            : undefined
        }
      />
    </div>
  );
}
