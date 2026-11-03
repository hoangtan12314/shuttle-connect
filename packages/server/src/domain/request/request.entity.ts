import {
  MAX_JOINS_PER_SESSION,
  REJOIN_COOLDOWN_MINUTES,
  RequestStatus,
} from '@shuttle-connect/types';
import { JoinLimitReachedError, RejoinCooldownError } from '../shared/errors';

const REJOIN_COOLDOWN_MS = REJOIN_COOLDOWN_MINUTES * 60 * 1000;

export class Request {
  constructor(
    private userId: string,
    private sessionId: string,
    private status: RequestStatus,
    private createdAt: Date,
    private joinCount: number,
  ) {}

  static create(props: {
    userId: string;
    sessionId: string;
    // The join count on the existing (WITHDRAWN) row, or 0 for a brand-new request -- this
    // becomes the new row's join_count, one higher.
    previousJoinCount?: number;
  }): Request {
    return new Request(
      props.userId,
      props.sessionId,
      RequestStatus.PENDING,
      new Date(),
      (props.previousJoinCount ?? 0) + 1,
    );
  }

  // Anti-churn check before rejoining a WITHDRAWN request. Pure and testable: takes plain data
  // read off the existing row, not a repository. The cap is checked first -- it's a permanent
  // block for this session, unlike the cooldown, which resolves itself as time passes.
  static assertCanRejoin(
    current: { joinCount: number; withdrawnAt: Date | null },
    now: Date,
  ): void {
    if (current.joinCount >= MAX_JOINS_PER_SESSION) {
      throw new JoinLimitReachedError();
    }

    if (current.withdrawnAt) {
      const elapsedMs = now.getTime() - current.withdrawnAt.getTime();
      if (elapsedMs < REJOIN_COOLDOWN_MS) {
        const remainingMinutes = Math.ceil((REJOIN_COOLDOWN_MS - elapsedMs) / 60_000);
        throw new RejoinCooldownError(remainingMinutes);
      }
    }
  }

  toJSON() {
    return {
      userId: this.userId,
      sessionId: this.sessionId,
      status: this.status,
      createdAt: this.createdAt,
      joinCount: this.joinCount,
    };
  }
}
