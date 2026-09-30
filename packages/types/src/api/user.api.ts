import { SkillLevel } from "../enums";

export interface UserItemResponse {
  id: string;
  fullName: string;
  email: string;
  skillLevel: SkillLevel;
  createdAt: string;
}
