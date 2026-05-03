/** Must match server `PORT` (default 5000 in server/src/server.js if unset). */
export const environment = {
  backendApiUrl: 'http://localhost:5000/api',
  /** Dev server: always log event filter traces in the browser console (and send `debugFilters=1` to the API). */
  debugEventFilters: true,
};
