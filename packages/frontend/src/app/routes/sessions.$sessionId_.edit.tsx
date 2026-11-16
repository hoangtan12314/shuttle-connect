import { createFileRoute } from '@tanstack/react-router';
import { EditSessionPage } from '@/pages/edit-session';

export const Route = createFileRoute('/sessions/$sessionId_/edit')({
  component: EditSessionPage,
  staticData: { requiresAuth: true },
});
