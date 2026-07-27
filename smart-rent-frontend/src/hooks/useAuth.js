import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

// ─────────────────────────────────────────────────────
// useAuth HOOK
// The single way to read auth state in any component.


const useAuth = () => {
    const context = useContext(AuthContext)

    if (context === null) {
        throw new Error(
            'useAuth must be used inside an AuthProvider. ' +
            'Wrap your component tree with <AuthProvider>.'
        )
    }

    return context
}

export default useAuth