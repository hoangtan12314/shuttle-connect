import { SessionCard, useSession } from '@/entities/session';
import { useMe } from '@/entities/user';
import { JoinSessionButton } from '@/features/join-session';
import { HostRequestPanel } from '@/widgets/host-requests-panel';
import { useParams } from '@tanstack/react-router';
import { useAuth } from 'react-oidc-context';

export function SessionDetailPage() {
  const { sessionId } = useParams({ from: '/sessions/$sessionId' });

  const {
    data: session,
    isLoading: isSessionLoading,
    isError: isSessionError,
  } = useSession(sessionId);

  const { isAuthenticated } = useAuth();
  const { data: myProfile, isLoading: isMyProfileLoading } =
    useMe(isAuthenticated);

  const isHost = myProfile?.id === session?.host.id;

  if (isSessionLoading || isMyProfileLoading) {
    return <div>Loading ...</div>;
  }

  if (isSessionError || !session) {
    return <div>Error loading Session</div>;
  }

  if (!isHost) {
    return (
      <SessionCard
        session={session}
        action={
          <JoinSessionButton
            session={session}
            isAuthenticated={isAuthenticated}
          />
        }
      />
    );
  }

  return <HostRequestPanel sessionId={session.id} />;
}
