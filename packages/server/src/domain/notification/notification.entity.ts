import { NotificationType } from '@shuttle-connect/types';

export interface NotificationProps {
  hostId: string;
  type: NotificationType;
  sessionId: string;
  courtName: string;
  sessionStartTime: Date;
  actorName: string;
  wasApproved: boolean;
  // The DynamoDB stream record's own eventID -- doubles as this notification's identity, so a
  // redelivered stream record maps to the exact same item instead of a new one.
  eventId: string;
  // When the change happened, taken from the stream record -- NOT new Date() at processing time.
  // It's part of the sort key, so it must be identical on every redelivery of the same record.
  occurredAt: Date;
}

export class Notification {
  private constructor(
    public readonly id: string,
    private hostId: string,
    private type: NotificationType,
    private sessionId: string,
    private courtName: string,
    private sessionStartTime: Date,
    private actorName: string,
    private wasApproved: boolean,
    private createdAt: Date,
  ) {}

  static create(props: NotificationProps): Notification {
    return new Notification(
      props.eventId,
      props.hostId,
      props.type,
      props.sessionId,
      props.courtName,
      props.sessionStartTime,
      props.actorName,
      props.wasApproved,
      props.occurredAt,
    );
  }

  toJSON() {
    return {
      id: this.id,
      hostId: this.hostId,
      type: this.type,
      sessionId: this.sessionId,
      courtName: this.courtName,
      sessionStartTime: this.sessionStartTime,
      actorName: this.actorName,
      wasApproved: this.wasApproved,
      createdAt: this.createdAt,
    };
  }
}
