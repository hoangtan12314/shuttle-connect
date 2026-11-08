import {
  MAX_JOINS_PER_SESSION,
  REJOIN_COOLDOWN_MINUTES,
  RequestStatus,
} from '@shuttle-connect/types';
import { Request } from './request.entity';
import { JoinLimitReachedError, RejoinCooldownError } from '../shared/errors';

const NOW = new Date('2026-01-01T12:00:00.000Z');
const COOLDOWN_MS = REJOIN_COOLDOWN_MINUTES * 60 * 1000;

describe('Request.create', () => {
  it('creates a brand-new request as PENDING with joinCount 1 when no previousJoinCount is given', () => {
    const request = Request.create({ userId: 'user-1', sessionId: 'session-1' });
    expect(request.toJSON()).toMatchObject({
      userId: 'user-1',
      sessionId: 'session-1',
      status: RequestStatus.PENDING,
      joinCount: 1,
    });
  });

  it('bumps joinCount one above the previous row on a rejoin', () => {
    const request = Request.create({
      userId: 'user-1',
      sessionId: 'session-1',
      previousJoinCount: 2,
    });
    expect(request.toJSON().joinCount).toBe(3);
  });

  it('has no id field -- identity is the (sessionId, userId) pair, not a surrogate key', () => {
    const request = Request.create({ userId: 'user-1', sessionId: 'session-1' });
    expect(request.toJSON()).not.toHaveProperty('id');
  });
});

describe('Request.assertCanRejoin', () => {
  it('allows a rejoin once the cooldown has fully passed', () => {
    const withdrawnAt = new Date(NOW.getTime() - COOLDOWN_MS - 1);
    expect(() => Request.assertCanRejoin({ joinCount: 1, withdrawnAt }, NOW)).not.toThrow();
  });

  it('allows a rejoin exactly at the cooldown boundary (fully elapsed, inclusive)', () => {
    const withdrawnAt = new Date(NOW.getTime() - COOLDOWN_MS);
    expect(() => Request.assertCanRejoin({ joinCount: 1, withdrawnAt }, NOW)).not.toThrow();
  });

  it('blocks a rejoin one millisecond inside the cooldown, with the remaining minutes rounded up', () => {
    const withdrawnAt = new Date(NOW.getTime() - COOLDOWN_MS + 1);
    expect(() => Request.assertCanRejoin({ joinCount: 1, withdrawnAt }, NOW)).toThrow(
      RejoinCooldownError,
    );
  });

  it('allows a rejoin with no withdrawnAt at all (legacy row, never recorded a withdraw time)', () => {
    expect(() => Request.assertCanRejoin({ joinCount: 1, withdrawnAt: null }, NOW)).not.toThrow();
  });

  it('allows a rejoin one below the cap', () => {
    const withdrawnAt = new Date(NOW.getTime() - COOLDOWN_MS - 1);
    expect(() =>
      Request.assertCanRejoin({ joinCount: MAX_JOINS_PER_SESSION - 1, withdrawnAt }, NOW),
    ).not.toThrow();
  });

  it('blocks a rejoin exactly at the cap, even with the cooldown satisfied', () => {
    const withdrawnAt = new Date(NOW.getTime() - COOLDOWN_MS - 1);
    expect(() =>
      Request.assertCanRejoin({ joinCount: MAX_JOINS_PER_SESSION, withdrawnAt }, NOW),
    ).toThrow(JoinLimitReachedError);
  });

  it('checks the cap before the cooldown -- a capped request is blocked by the cap even while still inside the cooldown', () => {
    const withdrawnAt = new Date(NOW.getTime() - 1);
    expect(() =>
      Request.assertCanRejoin({ joinCount: MAX_JOINS_PER_SESSION, withdrawnAt }, NOW),
    ).toThrow(JoinLimitReachedError);
  });

  it('treats a mapper-defaulted joinCount of 1 (a pre-rate-limit legacy row) the same as any other first withdraw', () => {
    const withdrawnAt = new Date(NOW.getTime() - 1);
    expect(() => Request.assertCanRejoin({ joinCount: 1, withdrawnAt }, NOW)).toThrow(
      RejoinCooldownError,
    );
  });
});
