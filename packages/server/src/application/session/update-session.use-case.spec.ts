// @typescript-eslint/unbound-method flags `expect(repo.someMethod).toHaveBeenCalledWith(...)`
// as an unbound method reference -- a real risk for a class instance method that reads `this`,
// but these are jest.fn() mocks with no `this` of their own, so the rule's concern doesn't apply.
/* eslint-disable @typescript-eslint/unbound-method */
import {
  Area,
  City,
  SessionItemResponse,
  SessionStatus,
  ShuttleType,
  SkillLevel,
} from '@shuttle-connect/types';
import { UpdateSessionUseCase } from './update-session.use-case';
import type { SessionRepository } from '../../domain/session';
import {
  EntityNotFoundError,
  ForbiddenError,
  InvalidFieldLengthError,
  SessionNotEditableError,
} from '../../domain/shared/errors';
import { SlotsBelowFilledError } from '../../domain/session';

const SESSION_ID = 'b6f1c0de-0000-4000-8000-000000000001';

// 8 total, 5 remaining -> 3 already filled.
function makeSession(overrides: Partial<SessionItemResponse> = {}): SessionItemResponse {
  return {
    id: SESSION_ID,
    status: SessionStatus.OPEN,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    slotsRemaining: 5,
    slotsTotal: 8,
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
    host: { id: 'host-1', name: 'Host' },
    coverUrl: null,
    ...overrides,
  };
}

function makeSessionRepo(
  overrides: Partial<jest.Mocked<SessionRepository>> = {},
): jest.Mocked<SessionRepository> {
  return {
    listSessionsByDistrict: jest.fn(),
    findById: jest.fn().mockResolvedValue(makeSession()),
    getByUserId: jest.fn(),
    create: jest.fn(),
    setCover: jest.fn(),
    update: jest.fn().mockResolvedValue(makeSession()),
    ...overrides,
  };
}

describe('UpdateSessionUseCase', () => {
  it('throws EntityNotFoundError when the session does not exist', async () => {
    const repo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new UpdateSessionUseCase(repo);

    await expect(useCase.execute('host-1', SESSION_ID, { priceMale: 1 })).rejects.toThrow(
      EntityNotFoundError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('throws ForbiddenError when the caller is not the host', async () => {
    const repo = makeSessionRepo();
    const useCase = new UpdateSessionUseCase(repo);

    await expect(useCase.execute('not-the-host', SESSION_ID, { priceMale: 1 })).rejects.toThrow(
      ForbiddenError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects a session that has already started', async () => {
    const started = makeSession({ startTime: new Date(Date.now() - 1000).toISOString() });
    const repo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(started) });
    const useCase = new UpdateSessionUseCase(repo);

    await expect(useCase.execute('host-1', SESSION_ID, { priceMale: 1 })).rejects.toThrow(
      SessionNotEditableError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects a cancelled session', async () => {
    const cancelled = makeSession({ status: SessionStatus.CANCELLED });
    const repo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(cancelled) });
    const useCase = new UpdateSessionUseCase(repo);

    await expect(useCase.execute('host-1', SESSION_ID, { priceMale: 1 })).rejects.toThrow(
      SessionNotEditableError,
    );
  });

  it('rejects a description over the length limit', async () => {
    const repo = makeSessionRepo();
    const useCase = new UpdateSessionUseCase(repo);

    await expect(
      useCase.execute('host-1', SESSION_ID, { description: 'x'.repeat(501) }),
    ).rejects.toThrow(InvalidFieldLengthError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('passes only the changed fields, plus the slot state it read as the expected values', async () => {
    const repo = makeSessionRepo();
    const useCase = new UpdateSessionUseCase(repo);

    await useCase.execute('host-1', SESSION_ID, {
      priceMale: 70000,
      description: 'rotating doubles',
    });

    expect(repo.update).toHaveBeenCalledWith(
      SESSION_ID,
      'host-1',
      { slotsTotal: 8, slotsRemaining: 5 },
      {
        priceMale: 70000,
        priceFemale: undefined,
        shuttleType: undefined,
        minSkillLevel: undefined,
        description: 'rotating doubles',
        slots: undefined,
      },
    );
  });

  it('keeps the filled count when the total grows', async () => {
    const repo = makeSessionRepo();
    const useCase = new UpdateSessionUseCase(repo);

    await useCase.execute('host-1', SESSION_ID, { slotsTotal: 10 });

    // 3 filled stay filled -> 7 open.
    const [, , , changes] = repo.update.mock.calls[0];
    expect(changes.slots).toEqual({
      slotsTotal: 10,
      slotsRemaining: 7,
      status: SessionStatus.OPEN,
    });
  });

  it('flips the session to FULL when the new total equals the filled count', async () => {
    const repo = makeSessionRepo();
    const useCase = new UpdateSessionUseCase(repo);

    await useCase.execute('host-1', SESSION_ID, { slotsTotal: 3 });

    const [, , , changes] = repo.update.mock.calls[0];
    expect(changes.slots).toEqual({ slotsTotal: 3, slotsRemaining: 0, status: SessionStatus.FULL });
  });

  it('flips a FULL session back to OPEN when the total grows', async () => {
    const full = makeSession({ status: SessionStatus.FULL, slotsRemaining: 0 }); // 8 filled
    const repo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(full) });
    const useCase = new UpdateSessionUseCase(repo);

    await useCase.execute('host-1', SESSION_ID, { slotsTotal: 10 });

    const [, , , changes] = repo.update.mock.calls[0];
    expect(changes.slots).toEqual({
      slotsTotal: 10,
      slotsRemaining: 2,
      status: SessionStatus.OPEN,
    });
  });

  it('rejects a total below the number of players already filled', async () => {
    const repo = makeSessionRepo();
    const useCase = new UpdateSessionUseCase(repo);

    await expect(useCase.execute('host-1', SESSION_ID, { slotsTotal: 2 })).rejects.toThrow(
      SlotsBelowFilledError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('does not touch slots when the total is unchanged', async () => {
    const repo = makeSessionRepo();
    const useCase = new UpdateSessionUseCase(repo);

    await useCase.execute('host-1', SESSION_ID, { slotsTotal: 8, priceFemale: 60000 });

    const [, , , changes] = repo.update.mock.calls[0];
    expect(changes.slots).toBeUndefined();
  });

  it('skips the write and returns the session it read when nothing changes', async () => {
    const repo = makeSessionRepo();
    const useCase = new UpdateSessionUseCase(repo);

    // Empty body, and a total re-sent unchanged: both are "no changes".
    await expect(useCase.execute('host-1', SESSION_ID, {})).resolves.toEqual(makeSession());
    await useCase.execute('host-1', SESSION_ID, { slotsTotal: 8 });

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('returns what the repository returns', async () => {
    const updated = makeSession({ priceMale: 70000 });
    const repo = makeSessionRepo({ update: jest.fn().mockResolvedValue(updated) });
    const useCase = new UpdateSessionUseCase(repo);

    await expect(useCase.execute('host-1', SESSION_ID, { priceMale: 70000 })).resolves.toBe(
      updated,
    );
  });
});
