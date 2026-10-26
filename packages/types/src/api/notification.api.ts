import { NotificationType } from "../enums";

export interface NotificationItemResponse {
  id: string;
  type: NotificationType;
  sessionId: string;
  courtName: string;
  sessionStartTime: string;
  actorName: string;
  wasApproved: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItemResponse[];
  lastReadAt: string | null;
}
