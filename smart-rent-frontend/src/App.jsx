import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { MotionConfig } from 'framer-motion'
import { AuthProvider } from './context/AuthContext'
import router from './router/index'

function App() {
    return (
        // AuthProvider wraps everything so every
        // component in the tree can call useAuth()
        <AuthProvider>

            {/* MotionConfig makes every framer-motion
                component honour prefers-reduced-motion at
                the OS level. The CSS layer in index.css
                handles non-Framer transitions. */}
            <MotionConfig reducedMotion="user">

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
                                primary: '#1D9E75', // brand-green
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#EF4444', // danger-icon
                                secondary: '#fff',
                            },
                        },
                    }}
                />

            </MotionConfig>

        </AuthProvider>
    )
}

export default App
