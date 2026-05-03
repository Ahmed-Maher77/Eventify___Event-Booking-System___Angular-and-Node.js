/**
 * Production build: relative `/api` — use `proxy.conf.json` + `ng serve`, or serve the SPA behind a reverse proxy to the API.
 */
export const environment = {
  backendApiUrl: '/api',
  /** When true, Events page logs filter traces without `?debugFilters=1` (keep false for production). */
  debugEventFilters: false,
};
