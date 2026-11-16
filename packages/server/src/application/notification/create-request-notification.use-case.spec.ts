// @typescript-eslint/unbound-method flags `expect(repo.someMethod).toHaveBeenCalledWith(...)`
// as an unbound method reference -- a real risk for a class instance method that reads `this`,
// but these are jest.fn() mocks with no `this` of their own, so the rule's concern doesn't apply.
/* eslint-disable @typescript-eslint/unbound-method */
import {
  Area,
  City,
  NotificationType,
  SessionItemResponse,
  SessionStatus,
  ShuttleType,
  SkillLevel,
} from '@shuttle-connect/types';
import { CreateRequestNotificationUseCase } from './create-request-notification.use-case';
import type { NotificationRepository } from '../../domain/notification';
import type { SessionRepository } from '../../domain/session';

function makeSession(overrides: Partial<SessionItemResponse> = {}): SessionItemResponse {
  return {
    id: 'session-1',
    status: SessionStatus.OPEN,
    startTime: '2026-06-01T10:00:00.000Z',
    endTime: '2026-06-01T12:00:00.000Z',
    slotsRemaining: 2,
    slotsTotal: 4,
    priceMale: 50000,
    priceFemale: 50000,
    shuttleType: ShuttleType.YONEX_AS30,
    minSkillLevel: SkillLevel.BEGINNER,
    description: '',
    createdAt: '2026-05-01T00:00:00.000Z',
    court: {
      id: 'court-1',
      name: 'T19 Badminton',
      coordinates: { lat: 10.77, lng: 106.7 },
      district: Area.HCM_DISTRICT_10,
      city: City.HO_CHI_MINH,
    },
    host: { id: 'host-1', name: 'Host Name' },
    coverUrl: null,
    ...overrides,
  };
}

function makeNotificationRepo(
  overrides: Partial<jest.Mocked<NotificationRepository>> = {},
): jest.Mocked<NotificationRepository> {
  return {
    create: jest.fn(),
    deleteDecisionNotifications: jest.fn(),
    listForUser: jest.fn(),
    getReadAt: jest.fn(),
    markAllRead: jest.fn(),
    ...overrides,
  };
}

function makeSessionRepo(
  overrides: Partial<jest.Mocked<SessionRepository>> = {},
): jest.Mocked<SessionRepository> {
  return {
    listSessionsByDistrict: jest.fn(),
    findById: jest.fn(),
    getByUserId: jest.fn(),
    create: jest.fn(),
    setCover: jest.fn(),
    update: jest.fn(),
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<Parameters<CreateRequestNotificationUseCase['execute']>[0]> = {},
) {
  return {
    type: NotificationType.REQUEST_CREATED,
    sessionId: 'session-1',
    requesterId: 'requester-1',
    eventId: 'event-1',
    occurredAt: new Date('2026-06-01T09:00:00.000Z'),
    actorName: 'Player 1',
    courtName: 'T19 Badminton',
    sessionStartTime: new Date('2026-06-01T10:00:00.000Z'),
    wasApproved: false,
    ...overrides,
  };
}

describe('CreateRequestNotificationUseCase', () => {
  it('no-ops without creating a notification when the session is gone', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(null) });
    const notificationRepo = makeNotificationRepo();
    const useCase = new CreateRequestNotificationUseCase(notificationRepo, sessionRepo);

    await useCase.execute(baseInput());

    expect(notificationRepo.create).not.toHaveBeenCalled();
  });

  it.each([NotificationType.REQUEST_CREATED, NotificationType.REQUEST_WITHDRAWN])(
    'notifies the HOST, acted by the requester, for the host-facing type %s',
    async (type) => {
      const sessionRepo = makeSessionRepo({
        findById: jest
          .fn()
          .mockResolvedValue(makeSession({ host: { id: 'host-1', name: 'Host Name' } })),
      });
      const notificationRepo = makeNotificationRepo();
      const useCase = new CreateRequestNotificationUseCase(notificationRepo, sessionRepo);

      await useCase.execute(baseInput({ type, actorName: 'Player 1', requesterId: 'requester-1' }));

      expect(notificationRepo.create).toHaveBeenCalledTimes(1);
      const [notification] = notificationRepo.create.mock.calls[0];
      expect(notification.toJSON()).toMatchObject({
        recipientId: 'host-1',
        type,
        actorName: 'Player 1',
      });
    },
  );

  it.each([NotificationType.REQUEST_APPROVED, NotificationType.REQUEST_REJECTED])(
    'notifies the REQUESTER, acted by the host, for the player-facing type %s',
    async (type) => {
      const sessionRepo = makeSessionRepo({
        findById: jest
          .fn()
          .mockResolvedValue(makeSession({ host: { id: 'host-1', name: 'Host Name' } })),
      });
      const notificationRepo = makeNotificationRepo();
      const useCase = new CreateRequestNotificationUseCase(notificationRepo, sessionRepo);

      await useCase.execute(baseInput({ type, actorName: 'Player 1', requesterId: 'requester-1' }));

      expect(notificationRepo.create).toHaveBeenCalledTimes(1);
      const [notification] = notificationRepo.create.mock.calls[0];
      expect(notification.toJSON()).toMatchObject({
        recipientId: 'requester-1',
        type,
        actorName: 'Host Name',
      });
    },
  );

  it('passes wasApproved through to the created notification', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const notificationRepo = makeNotificationRepo();
    const useCase = new CreateRequestNotificationUseCase(notificationRepo, sessionRepo);

    await useCase.execute(
      baseInput({ type: NotificationType.REQUEST_WITHDRAWN, wasApproved: true }),
    );

    const [notification] = notificationRepo.create.mock.calls[0];
    expect(notification.toJSON()).toMatchObject({ wasApproved: true });
  });
});
