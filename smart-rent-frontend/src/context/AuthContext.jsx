import {createContext, useState, useEffect, useCallback,} from 'react'
import AuthService from '../services/auth.service'
import { UserStorage } from '../services/api'

// ─────────────────────────────────────────────────────
// AUTH CONTEXT
// This is the single source of truth for who is
// logged in across the entire app.
// ─────────────────────────────────────────────────────
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // ── Restore session on page load
    useEffect(() => {

        const restoreSession = async () => {
            // Check localStorage for cached user
            // This gives instant UI while API call happens
            const cachedUser = UserStorage.get()
            if (cachedUser) {
                setUser(cachedUser)
            }

            try {
                // Verify session is still valid with the server
                // This is the authoritative check
                const currentUser = await AuthService.getCurrentUser()
                setUser(currentUser)

            } catch {
                // Session expired or never existed
                // Clear any stale cached data
                setUser(null)
                UserStorage.clear()

            } finally {
                // Always stop the loading spinner
                // regardless of outcome
                setLoading(false)
            }
        }

        restoreSession()
    }, [])


    // ── LOGIN
    const login = useCallback(async (email, password) => {
        const loggedInUser = await AuthService.login(email, password)
        setUser(loggedInUser)
        return loggedInUser
    }, [])

    // ── LOGOUT ─────────────────────────────────────────
    // Called by Navbar logout button
    // Clears cookies on server, clears localStorage,
    // clears React state, redirects to login
    const logout = useCallback(async () => {
        await AuthService.logout()
        setUser(null)
        // Hard redirect so all React state is cleared
        window.location.href = '/login'
    }, [])

    // ── UPDATE USER ────────────────────────────────────
    // Called after profile update so navbar
    // reflects new name immediately without a page reload
    const updateUser = useCallback((updatedUser) => {
        setUser(updatedUser)
        UserStorage.set(updatedUser)
    }, [])

    // ── Derived values ─────────────────────────────────
    // Computed from user state so components do not
    // need to write user?.role === 'LANDLORD' everywhere
    const isAuthenticated = !!user
    const isTenant   = user?.role === 'TENANT'
    const isLandlord = user?.role === 'LANDLORD'
    const isAdmin    = user?.role === 'ADMIN'

    // ── Context value ──────────────────────────────────
    // Everything components can access via useAuth()
    const value = {
        // State
        user,
        loading,
        isAuthenticated,
        isTenant,
        isLandlord,
        isAdmin,

        // Actions
        login,
        logout,
        updateUser,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}