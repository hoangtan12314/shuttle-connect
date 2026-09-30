import { RequestStatus } from '@shuttle-connect/types';

export class Request {
  constructor(
    private userId: string,
    private sessionId: string,
    private status: RequestStatus,
    private createdAt: Date,
  ) {}

  static create(props: { userId: string; sessionId: string }): Request {
    return new Request(
      props.userId,
      props.sessionId,
      RequestStatus.PENDING,
      new Date(),
    );
  }

  toJSON() {
    return {
      userId: this.userId,
      sessionId: this.sessionId,
      status: this.status,
      createdAt: this.createdAt,
    };
  }
}
