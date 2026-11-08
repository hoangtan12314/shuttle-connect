import {
  Area,
  City,
  CourtItemResponse,
  ShuttleType,
  SessionStatus,
  SkillLevel,
  UserItemResponse,
} from '@shuttle-connect/types';
import { Session } from '../../../domain/session';
import { SessionMapper } from './session.mapper';

const START = new Date(Date.now() + 60 * 60 * 1000);
const END = new Date(START.getTime() + 2 * 60 * 60 * 1000);

function makeSession(): Session {
  return Session.create({
    courtId: 'court-1',
    hostId: 'host-1',
    startTime: START,
    endTime: END,
    slotsRemaining: 3,
    slotsTotal: 4,
    status: SessionStatus.OPEN,
    priceMale: 50000,
    priceFemale: 50000,
    shuttleType: ShuttleType.YONEX_AS30,
    minSkillLevel: SkillLevel.BEGINNER,
    description: 'Bring your own racket',
  });
}

const COURT: CourtItemResponse = {
  id: 'court-1',
  name: 'T19 Badminton',
  address: '19 Nguyen Van Troi',
  district: Area.HCM_DISTRICT_10,
  city: City.HO_CHI_MINH,
  latitude: 10.77,
  longitude: 106.7,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const HOST: UserItemResponse = {
  id: 'host-1',
  fullName: 'Host Name',
  email: 'host@example.com',
  skillLevel: SkillLevel.INTERMEDIATE,
  createdAt: '2026-01-01T00:00:00.000Z',
  onboarded: true,
};

// A raw DynamoDB item as the read path would see it. toPersistence doesn't write
// location/court_name/lat/lng/user_name/the GSI keys -- those come from the repository, which
// composes them with index-keys.ts around the mapper's own output (see SessionMapper's own
// comment) -- so this fixture layers them on top the same way the real repository does.
function makeRecord(session: Session, overrides: Record<string, any> = {}): Record<string, any> {
  return {
    ...SessionMapper.toPersistence(session),
    PK: `SESSION#${session.toJSON().id}`,
    location: 'HCM#HCM_DISTRICT_10',
    court_name: 'T19 Badminton',
    lat: 10.77,
    lng: 106.7,
    user_name: 'Host Name',
    ...overrides,
  };
}

describe('SessionMapper.toPersistence', () => {
  it('writes the core session fields, leaving GSI/location/denormalized fields to the repository', () => {
    const session = makeSession();
    const record = SessionMapper.toPersistence(session);

    expect(record.PK).toBe(`SESSION#${session.toJSON().id}`);
    expect(record.court_id).toBe('court-1');
    expect(record.user_id).toBe('host-1');
    expect(record.status).toBe(SessionStatus.OPEN);
    expect(record.slots_remaining).toBe(3);
    expect(record).not.toHaveProperty('location');
    expect(record).not.toHaveProperty('GSI1PK');
  });
});

describe('SessionMapper.toResponse', () => {
  it('builds a response directly from a fresh entity + court + host (the create path)', () => {
    const session = makeSession();
    const response = SessionMapper.toResponse(session, COURT, HOST);

    expect(response).toMatchObject({
      id: session.toJSON().id,
      status: SessionStatus.OPEN,
      slotsRemaining: 3,
      slotsTotal: 4,
      description: 'Bring your own racket',
      court: {
        id: 'court-1',
        name: 'T19 Badminton',
        coordinates: { lat: 10.77, lng: 106.7 },
        district: Area.HCM_DISTRICT_10,
        city: City.HO_CHI_MINH,
      },
      host: { id: 'host-1', name: 'Host Name' },
    });
  });

  it('builds the same response shape from a persisted record (the read path)', () => {
    const session = makeSession();
    const record = makeRecord(session);

    const fromRecord = SessionMapper.toResponse(record);
    const fromEntity = SessionMapper.toResponse(session, COURT, HOST);

    expect(fromRecord).toEqual(fromEntity);
  });

  it("derives city/district from the record's own location field, not from the court fields", () => {
    const record = makeRecord(makeSession(), { location: 'HN#HN_BA_DINH' });
    const response = SessionMapper.toResponse(record);

    expect(response.court.city).toBe(City.HANOI);
    expect(response.court.district).toBe(Area.HN_BA_DINH);
  });
});

describe('SessionMapper.toOverview', () => {
  it('omits host/description but keeps the denormalized court block', () => {
    const record = makeRecord(makeSession());
    const overview = SessionMapper.toOverview(record);

    expect(overview).not.toHaveProperty('host');
    expect(overview).not.toHaveProperty('description');
    expect(overview.court).toMatchObject({
      id: 'court-1',
      name: 'T19 Badminton',
      coordinates: { lat: 10.77, lng: 106.7 },
    });
  });
});
