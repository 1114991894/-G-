const API_URL = import.meta.env.VITE_API_URL || '';

export function getApiUrl(path: string): string {
  return API_URL ? `${API_URL}${path}` : path;
}