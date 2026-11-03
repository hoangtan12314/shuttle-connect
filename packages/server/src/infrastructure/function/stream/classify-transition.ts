import { NotificationType, RequestStatus } from '@shuttle-connect/types';

export type RequestTransitionAction =
  { kind: 'notify'; type: NotificationType; wasApproved: boolean } | { kind: 'retract' };

// Pure and dependency-free on purpose (only @shuttle-connect/types, nothing NestJS/AWS) -- unit
// tested directly with no AWS needed. Importing this from request-status-changed.handler.ts
// instead of defining it there keeps it that way: the handler module's own top-level imports
// transitively reach infra/dynamodb/provider's `import { Resource } from 'sst'`, whose ESM-only
// dist ts-jest's CommonJS transform can't parse -- a spec file importing straight from this file
// never touches that chain at all.
//
// Every row of the plan's "What triggers what" table, keyed purely on the old/new status pair.
// oldStatus is undefined for an INSERT record (a first join has no OldImage at all).
export function classifyTransition(
  oldStatus: RequestStatus | undefined,
  newStatus: RequestStatus,
): RequestTransitionAction | null {
  if (newStatus === RequestStatus.PENDING) {
    // First join (INSERT, no old status) or a rejoin after withdrawing -- both read as "someone
    // wants in" to the host.
    if (oldStatus === undefined || oldStatus === RequestStatus.WITHDRAWN) {
      return { kind: 'notify', type: NotificationType.REQUEST_CREATED, wasApproved: false };
    }
    // Host undid their own APPROVED/REJECTED decision -- remove the player's earlier notice
    // rather than sending a new "pending again" one.
    if (oldStatus === RequestStatus.APPROVED || oldStatus === RequestStatus.REJECTED) {
      return { kind: 'retract' };
    }
    return null;
  }

  if (newStatus === RequestStatus.APPROVED && oldStatus === RequestStatus.PENDING) {
    return { kind: 'notify', type: NotificationType.REQUEST_APPROVED, wasApproved: false };
  }

  if (newStatus === RequestStatus.REJECTED && oldStatus === RequestStatus.PENDING) {
    return { kind: 'notify', type: NotificationType.REQUEST_REJECTED, wasApproved: false };
  }

  if (
    newStatus === RequestStatus.WITHDRAWN &&
    (oldStatus === RequestStatus.PENDING || oldStatus === RequestStatus.APPROVED)
  ) {
    return {
      kind: 'notify',
      type: NotificationType.REQUEST_WITHDRAWN,
      wasApproved: oldStatus === RequestStatus.APPROVED,
    };
  }

  return null;
}
