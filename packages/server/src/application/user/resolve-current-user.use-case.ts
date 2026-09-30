import { Inject, Injectable } from '@nestjs/common';
import { SkillLevel } from '@shuttle-connect/types';
import { MAX_NAME_LENGTH, User, USER_REPOSITORY, type UserRepository } from '../../domain/user';

export interface ResolveCurrentUserInput {
  externalAuthId: string;
  // Only required when the user has to be provisioned — an existing user resolves from
  // externalAuthId alone.
  email?: string;
  name?: string;
}

@Injectable()
export class ResolveCurrentUserUseCase {
  // externalAuthId -> internal user id. The mapping never changes once written, so it is safe to
  // keep for the life of the warm container with no invalidation. If the user pool is replaced,
  // every externalAuthId changes too, so old entries simply stop being looked up.
  private readonly userIdCache = new Map<string, string>();

  constructor(@Inject(USER_REPOSITORY) private userRepository: UserRepository) {}

  async execute(input: ResolveCurrentUserInput): Promise<string> {
    const cached = this.userIdCache.get(input.externalAuthId);
    if (cached) return cached;

    const pointer = await this.userRepository.findByAuthId(input.externalAuthId);
    const userId = pointer ? pointer.id : await this.provision(input);

    this.userIdCache.set(input.externalAuthId, userId);
    return userId;
  }

  private async provision(input: ResolveCurrentUserInput): Promise<string> {
    if (!input.email) {
      // Unreachable with the current pool/client config (Cognito puts every readable attribute in
      // the ID token). If it fires, it's a server misconfiguration — surface it as a logged 500,
      // not a 401 the client would pointlessly retry.
      throw new Error(`Cannot provision user ${input.externalAuthId}: token carries no email`);
    }

    const user = User.create({
      externalAuthId: input.externalAuthId,
      email: input.email,
      // `name` is a required Cognito attribute; the email fallback is defensive only.
      fullName: (input.name ?? input.email.split('@')[0]).slice(0, MAX_NAME_LENGTH),
      skillLevel: SkillLevel.BEGINNER,
    });

    try {
      await this.userRepository.create(user);
      return user.id;
    } catch (err) {
      // Most likely two concurrent first requests raced and the other one won the write. Read
      // consistently: an eventually consistent read can miss the pointer that was just committed.
      const winner = await this.userRepository.findByAuthId(input.externalAuthId, {
        consistentRead: true,
      });
      if (!winner) throw err; // not a race — a real write failure
      return winner.id;
    }
  }
}
