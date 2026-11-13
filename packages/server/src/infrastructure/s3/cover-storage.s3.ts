import { Inject, Injectable } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { CoverContentType } from '@shuttle-connect/types';
import type { CoverStorage } from '../../domain/session';
import { S3_CLIENT } from './s3-client.provider';
import { MEDIA_BUCKET } from './media-bucket.provider';

// Covers are never overwritten (every upload gets a new uuid key), so they can be cached forever.
const COVER_CACHE_CONTROL = 'public, max-age=31536000, immutable';

@Injectable()
export class S3CoverStorage implements CoverStorage {
  constructor(
    @Inject(S3_CLIENT) private client: S3Client,
    @Inject(MEDIA_BUCKET) private bucket: string,
  ) {}

  async put(key: string, body: Buffer, contentType: CoverContentType): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: COVER_CACHE_CONTROL,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
