import { Area, City } from "../enums";

export interface CreateCourtInput {
  name: string;
  address: string;
  district: Area;
  city: City;
  latitude: number;
  longitude: number;
}

export interface CourtItemResponse {
  id: string;
  name: string;
  address: string;
  district: string;
  city: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

