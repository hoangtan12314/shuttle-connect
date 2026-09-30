import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// What AuthGuard attaches to `request.user`. Deliberately minimal: a use case that needs the live
// profile (name, skill level) fetches it via UserRepository.findById(id) instead of trusting a copy.
export interface AuthUser {
  id: string;
  externalAuthId: string;
}

// Reads what AuthGuard wrote. Undefined on @Public() routes, since the guard returns before
// resolving a user there.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);
