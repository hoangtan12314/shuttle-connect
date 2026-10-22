import { SkillLevel, UserItemResponse } from '@shuttle-connect/types';
import { User } from './user.entity';

export interface FindByAuthIdOptions {
  // Strongly consistent read — needed right after a conflicting write, where an eventually
  // consistent read can still miss the item another request just committed.
  consistentRead?: boolean;
}

export interface UserRepository {
  findByAuthId(
    externalAuthId: string,
    options?: FindByAuthIdOptions,
  ): Promise<{ id: string } | null>; // AUTH# -> USER#
  findById(id: string): Promise<UserItemResponse | null>; // direct GetItem
  create(user: User): Promise<void>; // TransactWrite both items
  update(
    id: string,
    fields: { fullName?: string; skillLevel?: SkillLevel },
  ): Promise<UserItemResponse>;
  // Sets name + level and stamps onboarded_at (first time only -- repeat calls just edit).
  completeOnboarding(
    id: string,
    fields: { fullName: string; skillLevel: SkillLevel },
  ): Promise<UserItemResponse>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
