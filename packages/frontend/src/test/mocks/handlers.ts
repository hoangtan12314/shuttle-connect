import { http } from 'msw';

// MSW request handlers, typed against @shuttle-connect/types response shapes.
// Add one per endpoint as you build each entity/feature's api/ hooks, e.g.:
//   http.get(`${API_URL}/sessions`, () => HttpResponse.json({ success: true, data: [...] }))
export const handlers: ReturnType<typeof http.get>[] = [];
