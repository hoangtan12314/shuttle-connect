import { createFileRoute } from '@tanstack/react-router';

// No backend endpoint yet -- see the plan's "Backend follow-ups" list.
export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
});

function NotificationsPage() {
  return <div className="p-4">Notifications -- coming soon.</div>;
}
