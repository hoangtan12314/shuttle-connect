import {
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
  const body = (await response.json()) as ApiResponse<T>;

  if (!body.success) {
    // TODO: Check unauthorized code
    // if (body.error.code === ErrorCode.UNAUTHORIZED) {
    // }
    throw new ApiError(body.error);
  }

  return body.data;
}
