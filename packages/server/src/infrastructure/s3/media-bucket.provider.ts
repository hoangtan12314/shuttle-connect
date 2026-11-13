import { Resource } from 'sst';

export const MEDIA_BUCKET = Symbol('MediaBucket');

export const MediaBucketProvider = {
  provide: MEDIA_BUCKET,
  useFactory: (): string => Resource['shuttle-connect-media'].name,
};
