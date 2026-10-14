import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Shared MSW server for Vitest. Started/stopped in test/setup.ts.
export const server = setupServer(...handlers);
