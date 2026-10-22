import { SkillLevel, UserItemResponse } from '@shuttle-connect/types';
import { User } from '../../../domain/user';

export interface UserRecord {
  PK: string;
  SK: string;
  full_name: string;
  email: string;
  skill_level: SkillLevel;
  created_at: number;
  // Epoch ms of first-login onboarding. Absent = not onboarded yet (no migration needed: every
  // pre-existing user simply lacks it).
  onboarded_at?: number;
}

export class UserMapper {
  static toPersistence(user: User): Record<string, any> {
    const data = user.toJSON();

    return {
      PK: `USER#${data.id}`,
      SK: 'META',
      full_name: data.fullName,
      email: data.email,
      skill_level: data.skillLevel,
      created_at: data.createdAt.getTime(),
    };
  }

  static toResponse(item: Record<string, any>): UserItemResponse {
    return {
      id: item.PK.replace('USER#', ''),
      fullName: item.full_name,
      email: item.email,
      skillLevel: item.skill_level,
      createdAt: new Date(item.created_at).toISOString(),
      onboarded: item.onboarded_at !== undefined,
    };
  }

  static toAuthPointer(user: User): Record<string, any> {
    const data = user.toJSON();
    return {
      PK: `AUTH#${data.externalAuthId}`,
      SK: 'META',
      app_user_id: user.id,
    };
  }
}
