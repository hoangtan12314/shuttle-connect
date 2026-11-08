import { Area, City } from '@shuttle-connect/types';
import { Court } from '../../../domain/court';
import { CourtMapper } from './court.mapper';

function makeCourt(): Court {
  return Court.create({
    name: 'T19 Badminton',
    address: '19 Nguyen Van Troi',
    district: Area.HCM_DISTRICT_10,
    city: City.HO_CHI_MINH,
    latitude: 10.77,
    longitude: 106.7,
  });
}

describe('CourtMapper.toPersistence', () => {
  it('builds the PK/SK, the location key, and the GSI1 key from the entity', () => {
    const court = makeCourt();
    const record = CourtMapper.toPersistence(court);

    expect(record.PK).toBe(`COURT#${court.id}`);
    expect(record.SK).toBe('META');
    expect(record.location).toBe('HCM#HCM_DISTRICT_10');
    expect(record.GSI1PK).toBe('CLOC#HCM#HCM_DISTRICT_10');
    expect(record.name).toBe('T19 Badminton');
    expect(record.latitude).toBe(10.77);
    expect(record.longitude).toBe(106.7);
  });
});

describe('CourtMapper.toResponse', () => {
  it('builds a response directly from a fresh entity (the create path)', () => {
    const court = makeCourt();
    const response = CourtMapper.toResponse(court);

    expect(response).toMatchObject({
      id: court.id,
      name: 'T19 Badminton',
      address: '19 Nguyen Van Troi',
      district: Area.HCM_DISTRICT_10,
      city: City.HO_CHI_MINH,
      latitude: 10.77,
      longitude: 106.7,
    });
  });

  it('builds the same response shape from a persisted record (the read path)', () => {
    const court = makeCourt();
    const record = CourtMapper.toPersistence(court);
    const response = CourtMapper.toResponse(record);

    expect(response).toEqual(CourtMapper.toResponse(court));
  });
});

describe('CourtMapper.toOverview', () => {
  it('projects only id/name/address from a record', () => {
    const court = makeCourt();
    const record = CourtMapper.toPersistence(court);

    expect(CourtMapper.toOverview(record)).toEqual({
      id: court.id,
      name: 'T19 Badminton',
      address: '19 Nguyen Van Troi',
    });
  });
});
