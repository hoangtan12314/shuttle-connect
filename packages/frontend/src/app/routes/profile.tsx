import { createFileRoute } from '@tanstack/react-router';

// Real content (pages/profile, features/update-profile) is Phase 5.
export const Route = createFileRoute('/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  return <div className="p-4">Profile -- coming soon.</div>;
}
