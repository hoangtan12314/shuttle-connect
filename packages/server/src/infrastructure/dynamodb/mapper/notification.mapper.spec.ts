import { NotificationType } from '@shuttle-connect/types';
import { Notification } from '../../../domain/notification';
import { NotificationMapper } from './notification.mapper';

const OCCURRED_AT = new Date('2026-01-01T12:00:00.000Z');

function makeNotification(): Notification {
  return Notification.create({
    recipientId: 'host-1',
    type: NotificationType.REQUEST_CREATED,
    sessionId: 'session-1',
    courtName: 'T19 Badminton',
    sessionStartTime: new Date('2026-01-02T09:00:00.000Z'),
    actorName: 'Player 1',
    wasApproved: false,
    eventId: 'event-42',
    occurredAt: OCCURRED_AT,
  });
}

describe('NotificationMapper.toPersistence', () => {
  it('keys by USER#<recipientId> / NOTIF#<createdAtMs>#<eventId>, sortable newest-first by construction', () => {
    const notification = makeNotification();
    const record = NotificationMapper.toPersistence(notification);

    expect(record.PK).toBe('USER#host-1');
    expect(record.SK).toBe(`NOTIF#${OCCURRED_AT.getTime()}#event-42`);
  });

  it('sets expires_at 60 days (in seconds) after created_at', () => {
    const notification = makeNotification();
    const record = NotificationMapper.toPersistence(notification);

    const sixtyDaysInSeconds = 60 * 24 * 60 * 60;
    expect(record.expires_at).toBe(Math.floor(OCCURRED_AT.getTime() / 1000) + sixtyDaysInSeconds);
  });
});

describe('NotificationMapper.toResponse', () => {
  it('extracts the eventId back out of the SK as the response id', () => {
    const notification = makeNotification();
    const record = NotificationMapper.toPersistence(notification);

    expect(NotificationMapper.toResponse(record).id).toBe('event-42');
  });

  it('maps every other field through', () => {
    const notification = makeNotification();
    const record = NotificationMapper.toPersistence(notification);

    expect(NotificationMapper.toResponse(record)).toMatchObject({
      type: NotificationType.REQUEST_CREATED,
      sessionId: 'session-1',
      courtName: 'T19 Badminton',
      actorName: 'Player 1',
      wasApproved: false,
    });
  });
});
