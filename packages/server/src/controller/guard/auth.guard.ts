import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { CognitoIdTokenPayload } from 'aws-jwt-verify/jwt-model';
import { FetchError } from 'aws-jwt-verify/error';
import { ResolveCurrentUserUseCase } from '../../application/user';
import { UnauthorizedError } from '../../domain/shared/errors';
import { COGNITO_TOKEN_VERIFIER, type CognitoTokenVerifier } from '../../infrastructure/auth';
import type { AuthUser } from './current-user.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';

// Auth schemes are case-insensitive (RFC 7235), and anything that isn't a Bearer token is rejected
// outright rather than passed to the verifier.
const BEARER = /^Bearer\s+(\S+)$/i;

// ID-token claims like `email`/`name` are typed `Json` by aws-jwt-verify, not `string`.
const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

@Injectable()
export class AuthGuard implements CanActivate {
  // Explicit @Inject on every param: SST's esbuild bundle doesn't emit constructor type metadata,
  // so Nest can't infer class dependencies from the parameter types alone.
  constructor(
    @Inject(Reflector) private reflector: Reflector,
    @Inject(COGNITO_TOKEN_VERIFIER) private tokenVerifier: CognitoTokenVerifier,
    @Inject(ResolveCurrentUserUseCase) private resolveCurrentUser: ResolveCurrentUserUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = BEARER.exec(request.headers.authorization ?? '')?.[1];
    if (!token) throw new UnauthorizedError();

    const claims = await this.verify(token);
    
    // Plain strings in — no aws-jwt-verify types leak into the application layer.
    const userId = await this.resolveCurrentUser.execute({
      externalAuthId: claims.sub,
      email: asString(claims.email),
      name: asString(claims.name),
    });

    request.user = { id: userId, externalAuthId: claims.sub } satisfies AuthUser;
    return true;
  }

  private async verify(token: string): Promise<CognitoIdTokenPayload> {
    try {
      return await this.tokenVerifier.verify(token);
    } catch (err) {
      // Couldn't reach Cognito's JWKS — an outage on our side, not a bad token. Let it surface as
      // a logged 500 instead of a 401 that would send the client into a pointless re-login.
      if (err instanceof FetchError) throw err;
      throw new UnauthorizedError();
    }
  }
}
