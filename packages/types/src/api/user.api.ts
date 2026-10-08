import { SkillLevel } from "../enums";

export interface UserItemResponse {
  id: string;
  fullName: string;
  email: string;
  skillLevel: SkillLevel;
  createdAt: string;
}

export interface UpdateProfileInput {
  skillLevel?: SkillLevel,
  fullName?: string
}
