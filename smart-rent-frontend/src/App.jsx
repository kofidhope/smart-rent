import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import router from './router/index'

function App() {
    return (
        // AuthProvider wraps everything so every
        // component in the tree can call useAuth()
        <AuthProvider>

            {/* RouterProvider renders the matched page */}
            <RouterProvider router={router} />

            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#fff',
                        color: '#111827',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#1D9E75',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />

        </AuthProvider>
    )
}

export default App