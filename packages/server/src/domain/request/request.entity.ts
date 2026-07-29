import { RequestStatus } from '@shuttle-connect/types';

export class Request {
  constructor(
    private id: string,
    private userId: string,
    private status: RequestStatus,
  ) {}

  static create(props: { userId: string; title: string; description: string }): Request {
    return new Request(crypto.randomUUID(), props.userId, RequestStatus.PENDING);
  }

  static fromPersistence(props: { id: string; userId: string; status: RequestStatus }): Request {
    return new Request(props.id, props.userId, props.status);
  }
}
