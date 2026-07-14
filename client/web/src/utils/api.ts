const API_URL = import.meta.env.VITE_API_URL || '';
const SHARED_API_URL = import.meta.env.VITE_SHARED_API_URL || API_URL;

export function getApiUrl(path: string): string {
  if (path.startsWith('/api/shared')) {
    return SHARED_API_URL ? `${SHARED_API_URL}${path}` : path;
  }
  return API_URL ? `${API_URL}${path}` : path;
}