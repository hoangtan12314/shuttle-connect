import { Area, City, RequestStatus, SkillLevel } from "../enums";

export interface CreateRequestInput {
  sessionId: string;
}

export interface RequestItemResponse {
  user: {
    id: string;
    name: string;
    skillLevel: SkillLevel;
  };
  session: {
    id: string;
    startTime: string;
    endTime: string;
  };
  court: {
    name: string;
    district: Area;
    city: City;
    coordinates: { lat: number; lng: number };
  };
  status: RequestStatus;
  createdAt: string;
}
