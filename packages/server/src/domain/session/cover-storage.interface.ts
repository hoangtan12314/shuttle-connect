import { CoverContentType } from '@shuttle-connect/types';

// Object storage for session cover photos, kept behind a port so use cases never import the AWS
// SDK (same reason repositories are interfaces here). The file is validated before this is ever
// called -- there's no separate "staged" state to check or expire, just write and delete.
export interface CoverStorage {
  put(key: string, body: Buffer, contentType: CoverContentType): Promise<void>;
  delete(key: string): Promise<void>;
}

export const COVER_STORAGE = Symbol('CoverStorage');
