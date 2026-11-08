import { NotificationType } from '@shuttle-connect/types';
import { Notification } from './notification.entity';

const OCCURRED_AT = new Date('2026-01-01T12:00:00.000Z');

function baseProps(overrides: Partial<Parameters<typeof Notification.create>[0]> = {}) {
  return {
    recipientId: 'user-1',
    type: NotificationType.REQUEST_CREATED,
    sessionId: 'session-1',
    courtName: 'T19 Badminton',
    sessionStartTime: new Date('2026-01-02T09:00:00.000Z'),
    actorName: 'Player 1',
    wasApproved: false,
    eventId: 'event-1',
    occurredAt: OCCURRED_AT,
    ...overrides,
  };
}

describe('Notification.create', () => {
  it('uses the stream eventId as the notification id', () => {
    const notification = Notification.create(baseProps({ eventId: 'stream-event-42' }));
    expect(notification.id).toBe('stream-event-42');
  });

  it('uses occurredAt (the stream record time), not the current time, as createdAt', () => {
    const notification = Notification.create(baseProps());
    expect(notification.toJSON().createdAt).toEqual(OCCURRED_AT);
  });

  it('maps every field through to toJSON', () => {
    const notification = Notification.create(
      baseProps({ type: NotificationType.REQUEST_WITHDRAWN, wasApproved: true }),
    );
    expect(notification.toJSON()).toMatchObject({
      recipientId: 'user-1',
      type: NotificationType.REQUEST_WITHDRAWN,
      sessionId: 'session-1',
      courtName: 'T19 Badminton',
      actorName: 'Player 1',
      wasApproved: true,
    });
  });
});
