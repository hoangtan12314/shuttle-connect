import {
  ErrorCode,
  type ApiErrorResponse,
  type ApiResponse,
} from '@shuttle-connect/types';
import { CONFIG } from '../config';

/**
 * Thrown by apiRequest() whenever the backend responds with { success: false, error }.
 * Carries the structured fields from ApiErrorResponse['error'] -- callers should branch on
 * `.code` (compare against the ErrorCode enum), not parse `.message` as a string.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(error: ApiErrorResponse['error']) {
    super(error.message);
    this.name = 'ApiError';
    this.code = error.code;
    this.statusCode = error.statusCode;
  }
}

function getIdToken(): string | undefined {
  const key = `oidc.user:${CONFIG.cognitoAuthority}:${CONFIG.cognitoClientId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw).id_token;
  } catch {
    return undefined;
  }
}

// GlobalExceptionFilter wraps every response our own server sends, but API Gateway's own errors
// (its stage-level throttle -- see infra/api.ts's defaultRouteSettings -- plus 503s/timeouts)
// never reach that filter at all: they come back as a bare `{ "message": "..." }`, or nothing
// parseable. Narrows to the real envelope so apiRequest doesn't crash on `body.error` being
// undefined for one of these.
function isApiResponse(body: unknown): body is ApiResponse<unknown> {
  return typeof body === 'object' && body !== null && 'success' in body;
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getIdToken();
  const response = await fetch(`${CONFIG.apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!isApiResponse(body)) {
    const rawMessage =
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : undefined;
    throw new ApiError({
      code:
        response.status === 429
          ? ErrorCode.RATE_LIMITED
          : ErrorCode.SERVER_ERROR,
      statusCode: response.status,
      message: rawMessage ?? `Request failed with status ${response.status}`,
    });
  }

  if (!body.success) {
    // TODO: Check unauthorized code
    // if (body.error.code === ErrorCode.UNAUTHORIZED) {
    // }
    throw new ApiError(body.error);
  }

  return body.data as T;
}
