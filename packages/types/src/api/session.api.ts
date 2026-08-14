import { ShuttleType, SkillLevel, SessionStatus } from "../enums";

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
    location: { lat: number; lng: number };
  };
  host: {
    id: string;
    name: string;
  };
}

export interface SessionOverview{
  id: string;
  status: SessionStatus;
  startTime: string;
  slotsRemaining: number;
  slotsTotal: number;
  shuttleType: ShuttleType;
  court: {
    id: string;
    name: string;
    location: { lat: number; lng: number };
  };
}