/**
 * The Angular dev server runs in its own container, but the browser on the
 * host talks to the backend via the host's published port - so the API base
 * is derived from the page's own hostname, not a container-internal name.
 */
export const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:4000/api`;
