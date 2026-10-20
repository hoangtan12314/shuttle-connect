import { createFileRoute } from '@tanstack/react-router';
import { ManageSessionPage } from '@/pages/manage-session';

export const Route = createFileRoute('/sessions/$sessionId_/manage')({
  component: ManageSessionPage,
});
