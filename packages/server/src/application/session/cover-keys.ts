import { CoverContentType } from '@shuttle-connect/types';

// The server validates and writes a cover photo itself, in one request, so every object ever
// written under this prefix is already a checked, publishable cover -- there's no "unconfirmed"
// state to stage separately or expire.
export const COVER_PREFIX = 'covers/';

const EXTENSIONS: Record<CoverContentType, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
};

export function coverKeyFor(sessionId: string, fileId: string, contentType: CoverContentType) {
  return `${COVER_PREFIX}${sessionId}/${fileId}.${EXTENSIONS[contentType]}`;
}
