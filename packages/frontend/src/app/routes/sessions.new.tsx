import { createFileRoute } from '@tanstack/react-router';
import { CreateSessionPage } from '@/pages/create-session';

export const Route = createFileRoute('/sessions/new')({
  component: CreateSessionPage,
});
