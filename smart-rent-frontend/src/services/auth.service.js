import api, { getErrorMessage, UserStorage } from './api'

// ─────────────────────────────────────────────────────
// AUTH SERVICE
//
// All authentication calls live here.
// Components never call api directly — they call
// these functions. If the endpoint URL ever changes
// you update it in one place not across ten components.
//
// Login and register → user-service
// Refresh and logout → auth-service directly
// getCurrentUser    → user-service (session restore)
// ─────────────────────────────────────────────────────

const AuthService = {

    // ───────────────────────────────────────────────────
    // LOGIN
    // POST /api/users/login
    // Flow:
    //   1. Sends email + password to user-service
    //   2. user-service validates password
    //   3. user-service calls auth-service for tokens
    //   4. auth-service sets httpOnly cookies
    //   5. user-service returns user profile only
    //   6. We store the profile in localStorage
    //   7. Return the user to AuthContext
    // ───────────────────────────────────────────────────
    login: async (email, password) => {
        try {
            const response = await api.post(
                '/api/users/login',
                { email, password }
            )

            const user = response.data

            // Store user profile so navbar and other
            // components can show name and role without
            // making an API call on every render
            UserStorage.set(user)
            return user

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // REGISTER
    // POST /api/users/register
    // Always creates a TENANT account.
    // Does NOT log the user in automatically.
    // After registering redirect to login page.
    // ───────────────────────────────────────────────────
    register: async (data) => {
        try {
            const response = await api.post(
                '/api/users/register',
                {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    password: data.password,
                    phoneNumber: data.phoneNumber,
                }
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // LOGOUT
    // POST /api/auth/logout
    // Flow:
    //   1. Browser sends refresh_token cookie
    //   2. auth-service revokes token in Redis
    //   3. auth-service clears both cookies
    //   4. We clear user from localStorage
    // Never throws — even if server call fails
    // we still clear local state and redirect
    // ───────────────────────────────────────────────────
    logout: async () => {
        try {
            await api.post('/api/auth/logout')
        } catch (error) {
            // Log silently — do not block logout
            console.warn('Logout server call failed:', error.message)
        } finally {
            // Always clear local storage
            UserStorage.clear()
        }
    },

    // ───────────────────────────────────────────────────
    // GET CURRENT USER
    // GET /api/users/profile
    // Called on app startup to restore session.
    // The browser sends the access_token cookie
    // automatically. If the cookie is valid the
    // gateway injects X-User-Id and user-service
    // returns the profile.
    // If this throws 401 the session is expired
    // and the user must log in again.
    // ───────────────────────────────────────────────────
    getCurrentUser: async () => {
        try {
            const response = await api.get('/api/users/profile')

            const user = response.data

            // Update stored profile in case role changed
            // e.g. tenant was promoted to landlord
            UserStorage.set(user)

            return user

        } catch (error) {
            // Clear stale user data from localStorage
            UserStorage.clear()
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // UPDATE PROFILE
    // PUT /api/users/profile
    // ───────────────────────────────────────────────────
    updateProfile: async (data) => {
        try {
            const response = await api.put('/api/users/profile', data)

            const updated = response.data
            UserStorage.set(updated)
            return updated

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ──────────────────────────────────────────────────
    // CHANGE PASSWORD
    // PUT /api/users/profile/password
    // ───────────────────────────────────────────────────
    changePassword: async (currentPassword, newPassword) => {
        try {
            await api.put('/api/users/profile/password', {
                currentPassword, newPassword,})
        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },
}

export default AuthService