import { createFileRoute } from '@tanstack/react-router';
import { BrowseSessionsPage } from '@/pages/browse-sessions';

export const Route = createFileRoute('/')({
  component: BrowseSessionsPage,
});
