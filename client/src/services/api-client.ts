const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

let isRefreshing = false;
let refreshSubscribers: Array<() => void> = [];

const onRefreshed = () => {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: () => void) => {
  refreshSubscribers.push(cb);
};

async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  const method = init?.method?.toUpperCase() || 'GET';
  const isFormData = init?.body instanceof FormData;
  const headers: Record<string, string> = {};

  if (method === 'GET' || !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (init?.headers) {
    const initHeaders = new Headers(init.headers);
    initHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  const fetchOptions: RequestInit = {
    ...init,
    credentials: 'include',
    headers,
  };

  if (method !== 'GET' && init?.body !== undefined) {
    fetchOptions.body = isFormData ? init.body : JSON.stringify(init.body);
  }

  const res = await fetch(`${BASE_URL}${path}`, fetchOptions);

  if (!res.ok) {
    // Si la petición retorna 401 y no es un login/refresh previo, intentar refrescar el token silenciosamente
    if (res.status === 401 && !isRetry && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });

          if (refreshRes.ok) {
            isRefreshing = false;
            onRefreshed();
            return request<T>(path, init, true);
          }
        } catch (err) {
          console.error('[SilentRefresh] Error al refrescar la sesión:', err);
        }

        isRefreshing = false;
        refreshSubscribers = [];
      } else {
        return new Promise<T>((resolve, reject) => {
          addRefreshSubscriber(() => {
            request<T>(path, init, true).then(resolve).catch(reject);
          });
        });
      }
    }

    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error || error?.message || `Error HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return null as unknown as T;
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (null as unknown as T);
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: any) =>
    request<T>(path, {
      method: 'POST',
      body,
    }),
  patch: <T>(path: string, body: any) =>
    request<T>(path, {
      method: 'PATCH',
      body,
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: 'DELETE',
    }),
};
