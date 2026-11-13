import { Resource } from 'sst';

// Public URL for an object under covers/, served by the media Router (CloudFront). Read lazily
// so importing a mapper never touches Resource -- only mapping an item that has a cover does.
export function mediaUrl(key: string): string {
  return `${Resource['shuttle-connect-media-cdn'].url}/${key}`;
}
