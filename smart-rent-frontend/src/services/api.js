import axios from 'axios'

// ─────────────────────────────────────────────────────
// AXIOS INSTANCE
//
// baseURL is empty because vite.config.js proxies
// every /api/* call to http://localhost:8882
// This means you write /api/users/login in every
// service file — never the full gateway URL
//
// withCredentials: true is the most important line
// in this entire file. It tells the browser to include
// cookies on every request including cross-origin ones.
// Without this line the httpOnly cookies are never sent
// and every request returns 401.
// ─────────────────────────────────────────────────────

const api = axios.create({
    baseURL: '',
    timeout: 15000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})

// ─────────────────────────────────────────────────────
// USER STORAGE
//
// With httpOnly cookies the browser handles tokens —
// JavaScript never touches them.
// We only store the user profile in localStorage
// so the navbar can show the user's name and role
// without making an API call on every render.
// ─────────────────────────────────────────────────────

export const UserStorage = {

    get: () => {
        try {
            const user = localStorage.getItem('smartrent_user')
            return user ? JSON.parse(user) : null
        } catch {
            return null
        }
    },

    set: (user) => {
        localStorage.setItem('smartrent_user', JSON.stringify(user))
    },

    clear: () => {
        localStorage.removeItem('smartrent_user')
    },
}

// ─────────────────────────────────────────────────────
// REFRESH QUEUE
//
// When the access token expires multiple requests
// can fail with 401 at the same time. Without this
// queue all of them would try to refresh simultaneously
// causing three refresh calls, token rotation errors,
// and the user getting logged out unexpectedly.
//
// The queue works like this:
//   Request 1 fails 401 → starts refresh, others wait
//   Request 2 fails 401 → joins the queue
//   Request 3 fails 401 → joins the queue
//   Refresh succeeds
//   All three retry automatically
// ─────────────────────────────────────────────────────

let isRefreshing = false
let waitingQueue = []

const processQueue = (error) => {
    waitingQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error)
        } else {
            resolve()
        }
    })
    waitingQueue = []
}

// ─────────────────────────────────────────────────────
// RESPONSE INTERCEPTOR
//
// Runs after every response comes back.
// On success — returns the response unchanged.
// On 401 — tries to refresh, then retries the
//   original request. If refresh also fails,
//   clears user data and redirects to log in.
// ─────────────────────────────────────────────────────

api.interceptors.response.use((response) => response,
    // Error path
    async (error) => {
        const originalRequest = error.config

        // ── Only handle 401 ───────────────────────────────
        // 403 = wrong role → do not refresh, user cannot access this resource regardless of token
        // 404 = not found → nothing to do with auth
        // 500 = server error → do not refresh
        if (error.response?.status !== 401) {
            return Promise.reject(error)
        }

        // ── Prevent infinite loop ─────────────────────────
        // If the refresh call itself returns 401 that means
        // the refresh token is also expired or invalid.
        // Mark this request so we do not retry it again.
        if (originalRequest._retry) {
            UserStorage.clear()
            window.location.href = '/login'
            return Promise.reject(error)
        }

        // ── Do not refresh on auth endpoints ─────────────
        // If login returns 401 = wrong password
        // If refresh returns 401 = refresh token expired
        // Neither should trigger another refresh attempt
        const url = originalRequest.url || ''
        if (
            url.includes('/auth/refresh') ||
            url.includes('/users/login')
        ) {
            return Promise.reject(error)
        }

        // ── If already refreshing join the queue ──────────
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                waitingQueue.push({ resolve, reject })
            }).then(() => {
                // Retry original request after refresh done
                return api(originalRequest)
            }).catch((err) => {
                return Promise.reject(err)
            })
        }

        // ── Start the refresh process ─────────────────────
        originalRequest._retry = true
        isRefreshing = true

        try {
            // POST /api/auth/refresh
            // Browser sends refresh_token cookie automatically
            // because withCredentials: true is set above
            // auth-service reads the cookie, validates it,
            // issues a new access_token cookie
            // Returns 200 with empty body on success
            await api.post('/api/auth/refresh')

            // Refresh succeeded
            // Tell all waiting requests to retry
            processQueue(null)

            // Retry the original request
            // Browser now sends the new access_token cookie
            return api(originalRequest)

        } catch (refreshError) {

            // Refresh failed — refresh token expired or revoked
            // Tell all waiting requests to fail
            processQueue(refreshError)

            // Clear user data
            UserStorage.clear()

            // Redirect to log-in
            window.location.href = '/login'

            return Promise.reject(refreshError)

        } finally {
            isRefreshing = false
        }
    }
)

// ─────────────────────────────────────────────────────
// ERROR HELPER
//
// Converts any axios error into a human-readable
// string that can be shown directly to the user.
// Used in every service file's catch block.
// ─────────────────────────────────────────────────────

export const getErrorMessage = (error) => {

    if (axios.isAxiosError(error)) {

        // Backend returned a structured error body
        // Your GlobalExceptionHandler returns:
        // { status, error, message, timestamp, path }
        const message = error.response?.data?.message
        if (message) return message

        // Network error — backend or gateway is down
        if (error.code === 'ERR_NETWORK') {
            return 'Cannot reach the server. ' + 'Please check your connection.'
        }

        // Request took longer than 15 seconds
        if (error.code === 'ECONNABORTED') {
            return 'Request timed out. Please try again.'
        }

        // HTTP errors with no-body
        const status = error.response?.status
        if (status === 401) {
            return 'Please login to continue.'
        }
        if (status === 403) {
            return 'You do not have permission ' + 'to perform this action.'
        }
        if (status === 404) {
            return 'The requested resource was not found.'
        }
        if (status === 409) {
            return 'A conflict occurred. ' + 'Please try again.'
        }
        if (status === 429) {
            return 'Too many requests. ' + 'Please wait a moment and try again.'
        }
        if (status === 500) {
            return 'A server error occurred. ' + 'Please try again later.'
        }
    }

    // Unknown error — not from axios
    return 'Something went wrong. Please try again.'
}

export default api