// shared/lib: deterministic "photo" look for entities that don't have a real image yet (court
// photos -- see the UI-refactor plan's Phase B for the real upload pipeline). Picking a gradient
// off a hash of the id, rather than at random, means the same court always renders the same
// placeholder across renders/reloads, so a session list doesn't flicker between colors.
const GRADIENTS = [
  'from-primary-600 to-primary-900',
  'from-accent-500 to-accent-800',
  'from-primary-700 to-accent-700',
  'from-neutral-700 to-primary-900',
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** e.g. courtPlaceholderGradient('court-123') -> 'from-primary-700 to-accent-700'. Same id
 *  always maps to the same entry. */
export function courtPlaceholderGradient(id: string): string {
  return GRADIENTS[hashString(id) % GRADIENTS.length];
}
