import { Area, City } from "../enums";

export interface CreateCourtInput {
  name: string;
  address: string;
  district: Area;
  city: City;
  latitude: number;
  longitude: number;
}

export interface ListCourtsByDistrictInput {
  city: City;
  area: Area;
}

export interface CourtItemResponse {
  id: string;
  name: string;
  address: string;
  district: Area;
  city: City;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface CourtItemOverview {
  id: string;
  name: string;
  address: string;
}

