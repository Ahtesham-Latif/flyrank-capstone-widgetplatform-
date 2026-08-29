// API Client connecting to all backend endpoints

// Configurable base URL — set VITE_API_URL in .env / .env.production.
// Falls back to '' so relative paths still work when frontend and backend
// share an origin (e.g. same reverse proxy in dev).
const API_URL = import.meta.env.VITE_API_URL || '';

// Dispatched on any 401 so the app shell can react in one place
// (e.g. redirect to /login, clear cached user state) instead of every
// call site having to check for it individually.
const SESSION_EXPIRED_EVENT = 'signallead:session-expired';

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API error: ${res.status}`);
  }

  // Some endpoints (e.g. logout, delete) may return no body
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

// Every request goes through this so base URL, credentials, and headers
// stay consistent — no call site can forget them.
const apiFetch = async (path: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const res = await fetch(`${API_URL}${path}`, {
      credentials: 'include', // required for cookie/session auth across origins
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    return res;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export interface LeadSubmission {
  name: string;
  email: string;
  [key: string]: string; // widgets may collect additional custom fields
}

export const authApi = {
  register: async (data: { email: string; password: string; name: string }) => {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  login: async (data: { email: string; password: string }) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  logout: async () => {
    const res = await apiFetch('/api/auth/logout', {
      method: 'POST',
    });
    return handleResponse(res);
  },
};

export const widgetApi = {
  create: async (data: { title: string; allowed_origins: string[] }) => {
    const res = await apiFetch('/api/widgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getAll: async () => {
    const res = await apiFetch('/api/widgets', {
      method: 'GET',
    });
    return handleResponse(res);
  },

  update: async (id: number, data: { title?: string; allowed_origins?: string[]; webhook_url?: string }) => {
    const res = await apiFetch(`/api/widgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id: number) => {
    const res = await apiFetch(`/api/widgets/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Public endpoint — no session, so credentials aren't required here,
  // but apiFetch sending them anyway is harmless (backend ignores unknown cookies).
  getPublicConfig: async (publicApiKey: string) => {
    const res = await apiFetch(`/api/widgets/${publicApiKey}/config`, {
      method: 'GET',
    });
    return handleResponse(res);
  },
};

export const submissionApi = {
  getAll: async () => {
    const res = await apiFetch('/api/submissions', {
      method: 'GET',
    });
    return handleResponse(res);
  },

  // Public endpoint — called from the embedded widget on a customer's site,
  // not from this dashboard, but kept here for the sandbox/demo page to reuse.
  submitLead: async (publicApiKey: string, data: LeadSubmission) => {
    const res = await apiFetch(`/api/submissions/${publicApiKey}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

export const systemApi = {
  checkHealth: async () => {
    const res = await apiFetch('/health', {
      method: 'GET',
    });
    return handleResponse(res);
  },

  getWidgetScriptUrl: () => {
    // VITE_BACKEND_URL must be the Express server origin (e.g. http://localhost:3000).
    // This is separate from API_URL (which stays '' so Vite proxy handles dashboard calls).
    // When pasting the embed snippet on an external site, this absolute URL is what matters.
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    return `${backendUrl}/widget.js`;
  },
};

// Usage in the app shell, once:
//   window.addEventListener('signallead:session-expired', () => {
//     navigate('/login');
//   });
export { SESSION_EXPIRED_EVENT };
