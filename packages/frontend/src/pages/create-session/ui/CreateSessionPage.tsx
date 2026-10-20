import { CreateSessionForm } from '@/features/create-session';
import { useT } from '@/shared/i18n';

// pages/create-session: renders features/create-session/CreateSessionForm
export function CreateSessionPage() {
  const t = useT();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t.createSession}</h1>
      <CreateSessionForm />
    </div>
  );
}
