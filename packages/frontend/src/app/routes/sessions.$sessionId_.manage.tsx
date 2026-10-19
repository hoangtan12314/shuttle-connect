import { createFileRoute } from '@tanstack/react-router';

// Future home of widgets/host-requests-panel, currently still rendered inline inside
// pages/session-detail/ui/SessionDetailPage.tsx -- moving it here is Phase 4 (host flows).
export const Route = createFileRoute('/sessions/$sessionId/manage')({
  component: ManageSessionPage,
});

function ManageSessionPage() {
  return <div className="p-4">Manage session -- coming soon.</div>;
}
