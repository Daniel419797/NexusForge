import axios from "axios";

// ── Global error event emitter for toast integration ──
type ErrorListener = (message: string) => void;
const errorListeners = new Set<ErrorListener>();
export function onApiError(listener: ErrorListener) {
    errorListeners.add(listener);
    return () => { errorListeners.delete(listener); };
}
function emitApiError(message: string) {
    errorListeners.forEach((fn) => fn(message));
}

/**
 * Pre-configured Axios instance for backend communication.
 * Interceptors handle auth token injection and auto-refresh.
 */
const api = axios.create({
    baseURL: '/api/v1',
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

// ── Request Interceptor: No-op — auth tokens are sent via httpOnly cookies ──
api.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle 401 + Token Refresh ──
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });

                processQueue(null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// ── 503 Retry: handle Render free-tier hibernation wake delay ──
// When the backend is cold-starting (Render wakes it), it briefly returns 503.
// We retry up to 3 times with growing delays so the user's request succeeds
// once the service is up, rather than showing an immediate error.
const MAX_503_RETRIES = 3;
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const retries: number = originalRequest._503Retries ?? 0;

        if (error.response?.status === 503 && retries < MAX_503_RETRIES) {
            originalRequest._503Retries = retries + 1;
            const delayMs = 3000 * originalRequest._503Retries; // 3s, 6s, 9s
            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            return api(originalRequest);
        }

        return Promise.reject(error);
    },
);

// ── Separate interceptor for global error toasts ──
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Skip 401 (handled by auth interceptor) and aborted requests
        if (!error.response || error.response.status === 401 || axios.isCancel(error)) {
            return Promise.reject(error);
        }
        const msg =
            error.response?.data?.message ||
            error.response?.data?.error ||
            (error.response.status >= 500 ? "Server error. Please try again later." : "Request failed.");
        emitApiError(msg);
        return Promise.reject(error);
    },
);

export default api;
