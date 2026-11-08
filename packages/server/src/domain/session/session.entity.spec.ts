import { MAX_SESSION_HOURS, SessionStatus, SkillLevel } from '@shuttle-connect/types';
import { Session } from './session.entity';
import { SessionFullError, SessionNotOpenError } from './session.error';
import {
  InvalidFieldLengthError,
  InvalidSessionTimeError,
  SessionTooLongError,
} from '../shared/errors';

const NOW = new Date('2026-06-01T12:00:00.000Z');
const START = new Date(NOW.getTime() + 60 * 60 * 1000); // 1h from "now"
const END = new Date(START.getTime() + 2 * 60 * 60 * 1000); // 2h session

function baseProps(overrides: Partial<Parameters<typeof Session.create>[0]> = {}) {
  return {
    courtId: 'court-1',
    hostId: 'host-1',
    startTime: START,
    endTime: END,
    slotsRemaining: 4,
    slotsTotal: 4,
    status: SessionStatus.OPEN,
    priceMale: 50000,
    priceFemale: 50000,
    shuttleType: 'Yonex',
    minSkillLevel: SkillLevel.BEGINNER,
    ...overrides,
  };
}

describe('Session.create', () => {
  beforeAll(() => jest.useFakeTimers().setSystemTime(NOW));
  afterAll(() => jest.useRealTimers());

  it('creates a session with the given props', () => {
    const session = Session.create(baseProps());
    expect(session.toJSON()).toMatchObject({
      courtId: 'court-1',
      hostId: 'host-1',
      slotsRemaining: 4,
      slotsTotal: 4,
      status: SessionStatus.OPEN,
      description: '',
    });
  });

  it('defaults description to an empty string when omitted', () => {
    const session = Session.create(baseProps());
    expect(session.toJSON().description).toBe('');
  });

  it('keeps a provided description', () => {
    const session = Session.create(baseProps({ description: 'Bring your own racket' }));
    expect(session.toJSON().description).toBe('Bring your own racket');
  });

  it('throws InvalidSlotValuesError when slotsRemaining is negative', () => {
    expect(() => Session.create(baseProps({ slotsRemaining: -1 }))).toThrow();
  });

  it('throws InvalidSlotValuesError when slotsRemaining exceeds slotsTotal', () => {
    expect(() => Session.create(baseProps({ slotsRemaining: 5, slotsTotal: 4 }))).toThrow();
  });

  it('accepts slotsRemaining equal to slotsTotal (boundary)', () => {
    expect(() => Session.create(baseProps({ slotsRemaining: 4, slotsTotal: 4 }))).not.toThrow();
  });

  it('throws InvalidFieldLengthError when description exceeds the max length', () => {
    expect(() => Session.create(baseProps({ description: 'a'.repeat(501) }))).toThrow(
      InvalidFieldLengthError,
    );
  });

  it('throws InvalidSessionTimeError when startTime is not before endTime', () => {
    expect(() => Session.create(baseProps({ startTime: END, endTime: START }))).toThrow(
      InvalidSessionTimeError,
    );
  });

  it('throws InvalidSessionTimeError when startTime is in the past', () => {
    const past = new Date(NOW.getTime() - 60 * 1000);
    expect(() =>
      Session.create(baseProps({ startTime: past, endTime: new Date(past.getTime() + 1000) })),
    ).toThrow(InvalidSessionTimeError);
  });

  it('throws SessionTooLongError when the duration exceeds MAX_SESSION_HOURS', () => {
    const tooLongEnd = new Date(START.getTime() + (MAX_SESSION_HOURS + 1) * 60 * 60 * 1000);
    expect(() => Session.create(baseProps({ endTime: tooLongEnd }))).toThrow(SessionTooLongError);
  });

  it('accepts a session exactly MAX_SESSION_HOURS long (boundary)', () => {
    const exactEnd = new Date(START.getTime() + MAX_SESSION_HOURS * 60 * 60 * 1000);
    expect(() => Session.create(baseProps({ endTime: exactEnd }))).not.toThrow();
  });
});

describe('Session.fillSlot', () => {
  beforeAll(() => jest.useFakeTimers().setSystemTime(NOW));
  afterAll(() => jest.useRealTimers());

  it('decrements slotsRemaining by one', () => {
    const session = Session.create(baseProps({ slotsRemaining: 2, slotsTotal: 4 }));
    session.fillSlot();
    expect(session.toJSON().slotsRemaining).toBe(1);
  });

  it('throws SessionNotOpenError when the session is not OPEN', () => {
    const session = Session.create(baseProps({ status: SessionStatus.FULL }));
    expect(() => session.fillSlot()).toThrow(SessionNotOpenError);
  });

  it('throws SessionFullError when there are no slots left, even if status is still OPEN', () => {
    const session = Session.create(baseProps({ slotsRemaining: 0, slotsTotal: 4 }));
    expect(() => session.fillSlot()).toThrow(SessionFullError);
  });
});

describe('Session.validateTimeSlot', () => {
  beforeAll(() => jest.useFakeTimers().setSystemTime(NOW));
  afterAll(() => jest.useRealTimers());

  it('passes for a valid future window within the max duration', () => {
    expect(() => Session.validateTimeSlot(START, END)).not.toThrow();
  });

  it('throws when start >= end', () => {
    expect(() => Session.validateTimeSlot(END, START)).toThrow(InvalidSessionTimeError);
  });
});
