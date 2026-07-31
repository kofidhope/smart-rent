import {createBrowserRouter, Navigate, Outlet, useLocation,} from 'react-router-dom'
import useAuth from '../hooks/useAuth'

import Layout from '../components/layout/Layout'
import HomePage from '../pages/public/HomePage'
import LoginPage from '../pages/public/LoginPage'
import RegisterPage from '../pages/public/RegisterPage'
import PropertiesPage from '../pages/public/PropertiesPage'
import PropertyDetailPage from '../pages/public/PropertyDetailPage'
import TenantDashboard from '../pages/tenant/TenantDashboard'
import MyBookings from '../pages/tenant/MyBookings'
import MyPayments from '../pages/tenant/MyPayments'
import LandlordDashboard from '../pages/landlord/LandlordDashboard'
import MyProperties from '../pages/landlord/MyProperties'
import CreateProperty from '../pages/landlord/CreateProperty'
import EditProperty from '../pages/landlord/EditProperty'
import PropertyBookings from '../pages/landlord/PropertyBookings'
import AdminDashboard from '../pages/admin/AdminDashboard'
import VerificationRequests from '../pages/admin/VerificationRequests'

import LoadingSpinner from '../components/ui/LoadingSpinner'

// ─────────────────────────────────────────────────────
// PROTECTED ROUTE
//
// Wraps any route that requires the user to be
// logged in. If they are not logged in they get
// redirected to /login and the current URL is
// saved so they can be redirected back after login.
//
// The loading check prevents the flicker where a
// logged-in user briefly sees the login page while
// the session is being restored on page load.
// ─────────────────────────────────────────────────────

function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth()
    const location = useLocation()

    // Still checking session — show spinner
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    // Not logged in — redirect to log in
    // Save current path so we can redirect back
    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                state={{ from: location.pathname }}
                replace
            />
        )
    }

    // Logged in — render the child route
    return <Outlet />
}

// ─────────────────────────────────────────────────────
// ROLE GUARD
//
// Wraps routes that require a specific role.
// Only used inside ProtectedRoute — we already
// know the user is logged in at this point.
//
// If a TENANT tries to access /landlord/dashboard
// they get redirected to their own dashboard.
// ─────────────────────────────────────────────────────

function RoleGuard({ allowedRoles }) {
    const { user } = useAuth()

    // User role not in allowed list
    if (!allowedRoles.includes(user?.role)) {

        // Redirect to appropriate dashboard
        if (user?.role === 'LANDLORD') {
            return <Navigate to="/landlord/dashboard" replace />
        }
        if (user?.role === 'ADMIN') {
            return <Navigate to="/admin/dashboard" replace />
        }
        // Default — redirect tenant to their dashboard
        return <Navigate to="/tenant/dashboard" replace />
    }

    return <Outlet />
}

// ─────────────────────────────────────────────────────
// GUEST ONLY ROUTE
//
// Redirects logged-in users away from login and
// register pages. If you are already logged in
// you should not see the login page.
// ─────────────────────────────────────────────────────

function GuestOnly() {
    const { isAuthenticated, loading, user } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (isAuthenticated) {
        // Redirect to role-appropriate dashboard
        if (user?.role === 'LANDLORD') {
            return <Navigate to="/landlord/dashboard" replace />
        }
        if (user?.role === 'ADMIN') {
            return <Navigate to="/admin/dashboard" replace />
        }
        return <Navigate to="/tenant/dashboard" replace />
    }

    return <Outlet />
}

// ─────────────────────────────────────────────────────
// ROUTER DEFINITION
// ─────────────────────────────────────────────────────

const router = createBrowserRouter([
    {
        // Layout wraps every page
        // Navbar and Footer live here
        element: <Layout />,
        children: [

            // ── Public routes ──────────────────────────────
            // Anyone can access these — logged in or not
            {
                path: '/',
                element: <HomePage />,
            },
            {
                path: '/properties',
                element: <PropertiesPage />,
            },
            {
                path: '/properties/:id',
                element: <PropertyDetailPage />,
            },

            // ── Guest only routes ──────────────────────────
            // Logged-in users get redirected to dashboard
            {
                element: <GuestOnly />,
                children: [
                    {
                        path: '/login',
                        element: <LoginPage />,
                    },
                    {
                        path: '/register',
                        element: <RegisterPage />,
                    },
                ],
            },

            // ── Protected routes ───────────────────────────
            // Must be logged in for all of these
            {
                element: <ProtectedRoute />,
                children: [

                    // ── Tenant routes ────────────────────────
                    {
                        element: (
                            <RoleGuard
                                allowedRoles={['TENANT']}
                            />
                        ),
                        children: [
                            {
                                path: '/tenant/dashboard',
                                element: <TenantDashboard />,
                            },
                            {
                                path: '/tenant/bookings',
                                element: <MyBookings />,
                            },
                            {
                                path: '/tenant/payments',
                                element: <MyPayments />,
                            },
                        ],
                    },

                    // ── Landlord routes ───────────────────────
                    {
                        element: (
                            <RoleGuard
                                allowedRoles={['LANDLORD']}
                            />
                        ),
                        children: [
                            {
                                path: '/landlord/dashboard',
                                element: <LandlordDashboard />,
                            },
                            {
                                path: '/landlord/properties',
                                element: <MyProperties />,
                            },
                            {
                                path: '/landlord/properties/new',
                                element: <CreateProperty />,
                            },
                            {
                                path: '/landlord/properties/:id/edit',
                                element: <EditProperty />,
                            },
                            {
                                path: '/landlord/properties/:propertyId/bookings',
                                element: <PropertyBookings />,
                            },
                        ],
                    },

                    // ── Admin routes ──────────────────────────
                    {
                        element: (
                            <RoleGuard
                                allowedRoles={['ADMIN']}
                            />
                        ),
                        children: [
                            {
                                path: '/admin/dashboard',
                                element: <AdminDashboard />,
                            },
                            {
                                path: '/admin/verification',
                                element: <VerificationRequests />,
                            },
                        ],
                    },
                ],
            },

            // ── Catch all ──────────────────────────────────
            // Any unknown URL redirects to home
            {
                path: '*',
                element: <Navigate to="/" replace />,
            },
        ],
    },
])

export default router