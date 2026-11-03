import { Area, City, RequestStatus, SkillLevel } from "../enums";

export interface CreateRequestInput {
  sessionId: string;
}

export interface DecideRequestInput {
  status: RequestStatus;
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
  // How many times this user has ever joined this session (withdraw-and-rejoin counts each
  // time). Lets the UI show "join limit reached" without a failed round-trip.
  joinCount: number;
  // Set on withdraw, cleared by nothing -- a fresh rejoin overwrites it on the next withdraw.
  // null until the first withdraw.
  withdrawnAt: string | null;
}
