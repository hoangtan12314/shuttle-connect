import { randomUUID } from 'crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  COVER_CONTENT_TYPES,
  COVER_UPLOAD_LIMIT,
  MAX_COVER_BYTES,
  MAX_COVER_CHANGES_PER_SESSION,
  SessionItemResponse,
} from '@shuttle-connect/types';
import {
  COVER_STORAGE,
  type CoverStorage,
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../domain/session';
import {
  EntityNotFoundError,
  ForbiddenError,
  InvalidCoverUploadError,
} from '../../domain/shared/errors';
import { RATE_LIMITER, type RateLimiter } from '../../domain/shared/rate-limit';
import { coverKeyFor } from './cover-keys';

// Kept framework-agnostic (a plain buffer + declared fields) rather than importing
// Express.Multer.File here -- the controller is the only layer that should know this is a
// multipart request at all.
export interface UploadedCoverFile {
  buffer: Buffer;
  size: number;
  mimetype: string;
}

// The browser sends the file straight to us now (not to S3 via a presigned ticket), so there's
// no separate "issue a ticket" / "confirm what landed" split -- one call validates and writes.
@Injectable()
export class UploadCoverUseCase {
  private readonly logger = new Logger(UploadCoverUseCase.name);

  constructor(
    @Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository,
    @Inject(COVER_STORAGE) private coverStorage: CoverStorage,
    @Inject(RATE_LIMITER) private rateLimiter: RateLimiter,
  ) {}

  async execute(
    userId: string,
    sessionId: string,
    file: UploadedCoverFile,
  ): Promise<SessionItemResponse> {
    // First, before any read: counts every attempt (including ones that fail the host check), so
    // an over-limit caller costs one write and nothing else.
    await this.rateLimiter.consume(userId, 'cover-upload', COVER_UPLOAD_LIMIT);

    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new EntityNotFoundError('Session');
    }

    if (userId !== session.host.id) {
      throw new ForbiddenError();
    }

    if (new Date(session.startTime).getTime() <= Date.now()) {
      throw new InvalidCoverUploadError('the session has already started');
    }

    // The interceptor's own limits.fileSize already rejects an oversized upload before this
    // code runs at all; this re-check is what actually matters for content type, since nothing
    // upstream validates that.
    const allowedType = (COVER_CONTENT_TYPES as readonly string[]).includes(file.mimetype);
    if (file.size > MAX_COVER_BYTES || !allowedType) {
      throw new InvalidCoverUploadError('The file is too large or not an allowed image type');
    }

    const contentType = file.mimetype as (typeof COVER_CONTENT_TYPES)[number];
    const key = coverKeyFor(sessionId, randomUUID(), contentType);
    await this.coverStorage.put(key, file.buffer, contentType);

    let result: Awaited<ReturnType<SessionRepository['setCover']>>;
    try {
      result = await this.sessionRepository.setCover(
        sessionId,
        userId,
        key,
        MAX_COVER_CHANGES_PER_SESSION,
      );
    } catch (error) {
      // Don't leave a published object behind that no session points at.
      await this.coverStorage.delete(key);
      throw error;
    }

    if (result.previousCoverKey && result.previousCoverKey !== key) {
      // The upload and the pointer swap already succeeded -- the host's request worked. A
      // failure here only leaves a harmless orphaned object in S3 (nothing points to it
      // anymore, so it's never served), which isn't worth failing the whole request over.
      try {
        await this.coverStorage.delete(result.previousCoverKey);
      } catch (error) {
        this.logger.warn(
          `Failed to delete previous cover ${result.previousCoverKey} for session ${sessionId}: ${String(error)}`,
        );
      }
    }

    return result.session;
  }
}
