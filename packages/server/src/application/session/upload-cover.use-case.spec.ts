// @typescript-eslint/unbound-method flags `expect(repo.someMethod).toHaveBeenCalledWith(...)`
// as an unbound method reference -- a real risk for a class instance method that reads `this`,
// but these are jest.fn() mocks with no `this` of their own, so the rule's concern doesn't apply.
/* eslint-disable @typescript-eslint/unbound-method */
import {
  Area,
  City,
  COVER_UPLOAD_LIMIT,
  MAX_COVER_BYTES,
  MAX_COVER_CHANGES_PER_SESSION,
  SessionItemResponse,
  SessionStatus,
  ShuttleType,
  SkillLevel,
} from '@shuttle-connect/types';
import { UploadCoverUseCase } from './upload-cover.use-case';
import type { CoverStorage, SessionRepository } from '../../domain/session';
import type { RateLimiter } from '../../domain/shared/rate-limit';
import {
  CoverChangeLimitReachedError,
  EntityNotFoundError,
  ForbiddenError,
  InvalidCoverUploadError,
  RateLimitExceededError,
} from '../../domain/shared/errors';

const SESSION_ID = 'b6f1c0de-0000-4000-8000-000000000001';

function makeSession(overrides: Partial<SessionItemResponse> = {}): SessionItemResponse {
  return {
    id: SESSION_ID,
    status: SessionStatus.OPEN,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
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
    setCover: jest.fn().mockResolvedValue({ previousCoverKey: null, session: makeSession() }),
    update: jest.fn(),
    ...overrides,
  };
}

function makeCoverStorage(
  overrides: Partial<jest.Mocked<CoverStorage>> = {},
): jest.Mocked<CoverStorage> {
  return {
    put: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// Allows every call by default; a test overrides consume to simulate the limit being hit.
function makeRateLimiter(
  overrides: Partial<jest.Mocked<RateLimiter>> = {},
): jest.Mocked<RateLimiter> {
  return {
    consume: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeFile(overrides: Partial<{ buffer: Buffer; size: number; mimetype: string }> = {}) {
  return {
    buffer: Buffer.from('fake-image-bytes'),
    size: 1024,
    mimetype: 'image/webp',
    ...overrides,
  };
}

describe('UploadCoverUseCase', () => {
  it('throws EntityNotFoundError when the session does not exist', async () => {
    const useCase = new UploadCoverUseCase(
      makeSessionRepo({ findById: jest.fn().mockResolvedValue(null) }),
      makeCoverStorage(),
      makeRateLimiter(),
    );

    await expect(useCase.execute('host-1', SESSION_ID, makeFile())).rejects.toThrow(
      EntityNotFoundError,
    );
  });

  it('throws ForbiddenError when the caller is not the host, without writing anything', async () => {
    const storage = makeCoverStorage();
    const useCase = new UploadCoverUseCase(makeSessionRepo(), storage, makeRateLimiter());

    await expect(useCase.execute('not-the-host', SESSION_ID, makeFile())).rejects.toThrow(
      ForbiddenError,
    );
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('rejects a session that has already started', async () => {
    const started = makeSession({ startTime: new Date(Date.now() - 1000).toISOString() });
    const useCase = new UploadCoverUseCase(
      makeSessionRepo({ findById: jest.fn().mockResolvedValue(started) }),
      makeCoverStorage(),
      makeRateLimiter(),
    );

    await expect(useCase.execute('host-1', SESSION_ID, makeFile())).rejects.toThrow(
      InvalidCoverUploadError,
    );
  });

  it.each([
    ['too large', makeFile({ size: MAX_COVER_BYTES + 1 })],
    ['not an allowed type', makeFile({ mimetype: 'text/html' })],
  ])('rejects a file that is %s, without writing to storage', async (_label, file) => {
    const storage = makeCoverStorage();
    const useCase = new UploadCoverUseCase(makeSessionRepo(), storage, makeRateLimiter());

    await expect(useCase.execute('host-1', SESSION_ID, file)).rejects.toThrow(
      InvalidCoverUploadError,
    );
    expect(storage.put).not.toHaveBeenCalled();
  });

  it("counts the request against the caller's cover-upload limit", async () => {
    const rateLimiter = makeRateLimiter();
    const useCase = new UploadCoverUseCase(makeSessionRepo(), makeCoverStorage(), rateLimiter);

    await useCase.execute('host-1', SESSION_ID, makeFile());

    expect(rateLimiter.consume).toHaveBeenCalledWith('host-1', 'cover-upload', COVER_UPLOAD_LIMIT);
  });

  it('rejects an over-limit caller before reading the session or writing anything', async () => {
    const sessionRepo = makeSessionRepo();
    const storage = makeCoverStorage();
    const rateLimiter = makeRateLimiter({
      consume: jest.fn().mockRejectedValue(new RateLimitExceededError('cover-upload', new Date())),
    });
    const useCase = new UploadCoverUseCase(sessionRepo, storage, rateLimiter);

    await expect(useCase.execute('host-1', SESSION_ID, makeFile())).rejects.toThrow(
      RateLimitExceededError,
    );
    expect(sessionRepo.findById).not.toHaveBeenCalled();
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('writes the file under covers/<sessionId>/ and points the session at it', async () => {
    const updated = makeSession({ coverUrl: 'https://cdn.example/covers/...' });
    const storage = makeCoverStorage();
    const sessionRepo = makeSessionRepo({
      setCover: jest.fn().mockResolvedValue({ previousCoverKey: null, session: updated }),
    });
    const useCase = new UploadCoverUseCase(sessionRepo, storage, makeRateLimiter());

    const result = await useCase.execute('host-1', SESSION_ID, makeFile());

    const [key, buffer, contentType] = storage.put.mock.calls[0];
    expect(key).toMatch(new RegExp(`^covers/${SESSION_ID}/[0-9a-f-]{36}\\.webp$`));
    expect(buffer).toBeInstanceOf(Buffer);
    expect(contentType).toBe('image/webp');
    expect(sessionRepo.setCover).toHaveBeenCalledWith(
      SESSION_ID,
      'host-1',
      key,
      MAX_COVER_CHANGES_PER_SESSION,
    );
    expect(result).toBe(updated);
  });

  it('deletes the previous cover when replacing it', async () => {
    const previous = `covers/${SESSION_ID}/11111111-1111-4111-8111-111111111111.webp`;
    const storage = makeCoverStorage();
    const sessionRepo = makeSessionRepo({
      setCover: jest.fn().mockResolvedValue({ previousCoverKey: previous, session: makeSession() }),
    });
    const useCase = new UploadCoverUseCase(sessionRepo, storage, makeRateLimiter());

    await useCase.execute('host-1', SESSION_ID, makeFile());

    expect(storage.delete).toHaveBeenCalledWith(previous);
  });

  it('still returns the updated session if deleting the previous cover fails', async () => {
    const previous = `covers/${SESSION_ID}/11111111-1111-4111-8111-111111111111.webp`;
    const updated = makeSession({ coverUrl: 'https://cdn.example/new-cover.webp' });
    const storage = makeCoverStorage({
      delete: jest.fn().mockRejectedValue(new Error('S3 is briefly unavailable')),
    });
    const sessionRepo = makeSessionRepo({
      setCover: jest.fn().mockResolvedValue({ previousCoverKey: previous, session: updated }),
    });
    const useCase = new UploadCoverUseCase(sessionRepo, storage, makeRateLimiter());

    // The upload and the pointer swap already succeeded -- a failure to clean up the orphaned
    // old object (never served again anyway) shouldn't fail the whole request.
    await expect(useCase.execute('host-1', SESSION_ID, makeFile())).resolves.toBe(updated);
  });

  it('removes the newly-written object again if setCover fails (e.g. the change cap)', async () => {
    const storage = makeCoverStorage();
    const sessionRepo = makeSessionRepo({
      setCover: jest.fn().mockRejectedValue(new CoverChangeLimitReachedError()),
    });
    const useCase = new UploadCoverUseCase(sessionRepo, storage, makeRateLimiter());

    await expect(useCase.execute('host-1', SESSION_ID, makeFile())).rejects.toThrow(
      CoverChangeLimitReachedError,
    );
    const [key] = storage.put.mock.calls[0];
    expect(storage.delete).toHaveBeenCalledWith(key);
  });
});
