import { createFileRoute } from '@tanstack/react-router';
import { SessionDetailPage } from '@/pages/session-detail';

export const Route = createFileRoute('/sessions/$sessionId')({
  component: SessionDetailPage,
});
