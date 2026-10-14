export const requestKeys = {
  all: ['requests'] as const,
  mine: () => [...requestKeys.all, 'mine'] as const,
  forSession: (sessionId: string) =>
    [...requestKeys.all, 'session', sessionId] as const,
};
