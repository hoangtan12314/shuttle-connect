import { createFileRoute } from '@tanstack/react-router';

// Replaces the old my-sessions/my-requests routes -- Hosting/Joined tabs land in Phase 5
// (see /Users/admin/.claude/plans/warm-scribbling-parnas.md).
export const Route = createFileRoute('/activity')({
  component: ActivityPage,
});

function ActivityPage() {
  return <div className="p-4">Activity -- coming soon.</div>;
}
