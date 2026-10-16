import { createFileRoute } from '@tanstack/react-router';

// Real content (pages/create-session, features/create-session) is Phase 4.
export const Route = createFileRoute('/sessions/new')({
  component: CreateSessionPage,
});

function CreateSessionPage() {
  return <div className="p-4">Create session -- coming soon.</div>;
}
