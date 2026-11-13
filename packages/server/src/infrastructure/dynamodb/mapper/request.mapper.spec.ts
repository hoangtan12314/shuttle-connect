import {
  Area,
  City,
  SessionItemResponse,
  SessionStatus,
  ShuttleType,
  SkillLevel,
  UserItemResponse,
} from '@shuttle-connect/types';
import { Request } from '../../../domain/request';
import { RequestMapper } from './request.mapper';

const SESSION: SessionItemResponse = {
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
  host: { id: 'host-1', name: 'Host' },
  coverUrl: null,
};

const USER: UserItemResponse = {
  id: 'requester-1',
  fullName: 'Player 1',
  email: 'player@example.com',
  skillLevel: SkillLevel.BEGINNER,
  createdAt: '2026-01-01T00:00:00.000Z',
  onboarded: true,
};

function makeRequest(): Request {
  return Request.create({ userId: 'requester-1', sessionId: 'session-1' });
}

function makeRecord(request: Request, overrides: Record<string, any> = {}): Record<string, any> {
  return {
    ...RequestMapper.toPersistence(request),
    location: 'HCM#HCM_DISTRICT_10',
    lat: 10.77,
    lng: 106.7,
    user_name: 'Player 1',
    skill_level: SkillLevel.BEGINNER,
    session_start_time: new Date(SESSION.startTime).getTime(),
    session_end_time: new Date(SESSION.endTime).getTime(),
    court_name: 'T19 Badminton',
    ...overrides,
  };
}

describe('RequestMapper.toPersistence', () => {
  it('keys by SESSION#<id> / REQUEST#USER#<userId> and carries status + joinCount', () => {
    const request = makeRequest();
    const record = RequestMapper.toPersistence(request);

    expect(record.PK).toBe('SESSION#session-1');
    expect(record.SK).toBe('REQUEST#USER#requester-1');
    expect(record.join_count).toBe(1);
  });
});

describe('RequestMapper.toResponse', () => {
  it('builds a response directly from a fresh entity + session + user, with withdrawnAt always null', () => {
    const request = makeRequest();
    const response = RequestMapper.toResponse(request, SESSION, USER);

    expect(response).toMatchObject({
      user: { id: 'requester-1', name: 'Player 1', skillLevel: SkillLevel.BEGINNER },
      session: { id: 'session-1' },
      court: { name: 'T19 Badminton', district: Area.HCM_DISTRICT_10, city: City.HO_CHI_MINH },
      joinCount: 1,
      withdrawnAt: null,
    });
  });

  it('builds the same response shape from a persisted record (the read path)', () => {
    const request = makeRequest();
    const record = makeRecord(request);

    expect(RequestMapper.toResponse(record)).toEqual(
      RequestMapper.toResponse(request, SESSION, USER),
    );
  });

  it('defaults joinCount to 1 for a legacy row with no join_count at all', () => {
    const request = makeRequest();
    const record = makeRecord(request);
    delete record.join_count;

    expect(RequestMapper.toResponse(record).joinCount).toBe(1);
  });

  it('keeps an explicit joinCount greater than 1', () => {
    const request = makeRequest();
    const record = makeRecord(request, { join_count: 3 });

    expect(RequestMapper.toResponse(record).joinCount).toBe(3);
  });

  it('reports withdrawnAt as null when withdrawn_at is absent', () => {
    const request = makeRequest();
    const record = makeRecord(request);

    expect(RequestMapper.toResponse(record).withdrawnAt).toBeNull();
  });

  it('reports withdrawnAt as an ISO string when withdrawn_at is present, even as epoch 0', () => {
    const request = makeRequest();
    const record = makeRecord(request, { withdrawn_at: 0 });

    // withdrawn_at !== undefined, not a truthiness check -- epoch 0 must still produce a real
    // timestamp, not be treated the same as "absent".
    expect(RequestMapper.toResponse(record).withdrawnAt).toBe(new Date(0).toISOString());
  });
});
