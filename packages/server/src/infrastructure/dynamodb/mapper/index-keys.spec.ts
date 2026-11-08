import { Area, City } from '@shuttle-connect/types';
import { courtGsi1, courtLocationKey, requestGsi2, sessionGsi1, sessionGsi2 } from './index-keys';

describe('sessionGsi1', () => {
  it('prefixes with SLOC# and sorts by startTime', () => {
    expect(sessionGsi1(City.HO_CHI_MINH, Area.HCM_DISTRICT_10, 1_700_000_000)).toEqual({
      GSI1PK: 'SLOC#HCM#HCM_DISTRICT_10',
      GSI1SK: 1_700_000_000,
    });
  });
});

describe('courtGsi1', () => {
  it('prefixes with CLOC# and sorts by createdAt', () => {
    expect(courtGsi1(City.HANOI, Area.HN_BA_DINH, 1_600_000_000)).toEqual({
      GSI1PK: 'CLOC#HN#HN_BA_DINH',
      GSI1SK: 1_600_000_000,
    });
  });
});

describe('courtLocationKey', () => {
  it('matches the same CLOC# prefix courtGsi1 uses for GSI1PK', () => {
    expect(courtLocationKey(City.HO_CHI_MINH, Area.HCM_DISTRICT_10)).toBe(
      'CLOC#HCM#HCM_DISTRICT_10',
    );
  });
});

describe('sessionGsi2', () => {
  it('keys by USER# and sorts by SESSION#<startTime>', () => {
    expect(sessionGsi2('host-1', 1_700_000_000)).toEqual({
      GSI2PK: 'USER#host-1',
      GSI2SK: 'SESSION#1700000000',
    });
  });
});

describe('requestGsi2', () => {
  it('keys by USER# and sorts by REQUEST#<sessionStartTime>, same partition as sessionGsi2', () => {
    expect(requestGsi2('user-1', 1_700_000_000)).toEqual({
      GSI2PK: 'USER#user-1',
      GSI2SK: 'REQUEST#1700000000',
    });
  });

  it('shares GSI2PK with sessionGsi2 for the same user id, which is what lets both sort together', () => {
    const session = sessionGsi2('user-1', 1_700_000_000);
    const request = requestGsi2('user-1', 1_600_000_000);
    expect(session.GSI2PK).toBe(request.GSI2PK);
  });
});
