import { Area, City, ShuttleType, SkillLevel, SessionStatus } from "../enums";

export interface ListSessionsByDistrictInput {
  startTime?: string;
  city: City;
  area: Area;
}

export interface CreateSessionInput {
  courtId: string;
  startTime: string;
  endTime: string;
  slotsRemaining: number;
  slotsTotal: number;
  priceMale: number;
  priceFemale: number;
  shuttleType: ShuttleType;
  minSkillLevel: SkillLevel;
  description?: string;
}

export interface SessionItemResponse {
  id: string;
  status: SessionStatus;
  startTime: string;
  endTime: string;
  slotsRemaining: number;
  slotsTotal: number;
  priceMale: number;
  priceFemale: number;
  shuttleType: ShuttleType;
  minSkillLevel: SkillLevel;
  description: string;
  createdAt: string;
  court: {
    id: string;
    name: string;
    coordinates: { lat: number; lng: number };
    district: Area;
    city: City;
  };
  host: {
    id: string;
    name: string;
  };
  // CloudFront URL of the cover photo, or null if the host never set one.
  coverUrl: string | null;
}

export interface SessionOverview {
  id: string;
  status: SessionStatus;
  startTime: string;
  endTime: string;
  slotsRemaining: number;
  slotsTotal: number;
  priceMale: number;
  priceFemale: number;
  shuttleType: ShuttleType;
  minSkillLevel: SkillLevel;
  court: {
    id: string;
    name: string;
    coordinates: { lat: number; lng: number };
    district: Area;
    city: City;
  };
  coverUrl: string | null;
}
