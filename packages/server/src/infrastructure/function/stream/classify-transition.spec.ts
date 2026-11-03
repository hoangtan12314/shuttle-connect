import { NotificationType, RequestStatus } from '@shuttle-connect/types';
import { classifyTransition } from './classify-transition';

const { PENDING, APPROVED, REJECTED, WITHDRAWN } = RequestStatus;

describe('classifyTransition', () => {
  it('a first join (INSERT, no old status) notifies the host of a new request', () => {
    expect(classifyTransition(undefined, PENDING)).toEqual({
      kind: 'notify',
      type: NotificationType.REQUEST_CREATED,
      wasApproved: false,
    });
  });

  it('a rejoin after withdrawing notifies the host of a new request', () => {
    expect(classifyTransition(WITHDRAWN, PENDING)).toEqual({
      kind: 'notify',
      type: NotificationType.REQUEST_CREATED,
      wasApproved: false,
    });
  });

  it('an approval notifies the player', () => {
    expect(classifyTransition(PENDING, APPROVED)).toEqual({
      kind: 'notify',
      type: NotificationType.REQUEST_APPROVED,
      wasApproved: false,
    });
  });

  it('a rejection notifies the player', () => {
    expect(classifyTransition(PENDING, REJECTED)).toEqual({
      kind: 'notify',
      type: NotificationType.REQUEST_REJECTED,
      wasApproved: false,
    });
  });

  it("undoing an approval retracts the player's earlier notice", () => {
    expect(classifyTransition(APPROVED, PENDING)).toEqual({ kind: 'retract' });
  });

  it("undoing a rejection retracts the player's earlier notice", () => {
    expect(classifyTransition(REJECTED, PENDING)).toEqual({ kind: 'retract' });
  });

  it('withdrawing a PENDING request notifies the host, wasApproved false', () => {
    expect(classifyTransition(PENDING, WITHDRAWN)).toEqual({
      kind: 'notify',
      type: NotificationType.REQUEST_WITHDRAWN,
      wasApproved: false,
    });
  });

  it('withdrawing an APPROVED request notifies the host, wasApproved true', () => {
    expect(classifyTransition(APPROVED, WITHDRAWN)).toEqual({
      kind: 'notify',
      type: NotificationType.REQUEST_WITHDRAWN,
      wasApproved: true,
    });
  });

  it('ignores a rejected request being withdrawn (not a real transition -- REJECTED cannot reach WITHDRAWN)', () => {
    expect(classifyTransition(REJECTED, WITHDRAWN)).toBeNull();
  });

  it('ignores a withdrawn request staying withdrawn (a redelivered no-op write, if it ever happened)', () => {
    expect(classifyTransition(WITHDRAWN, WITHDRAWN)).toBeNull();
  });

  it('ignores an already-approved request being "approved" again', () => {
    expect(classifyTransition(APPROVED, APPROVED)).toBeNull();
  });
});
