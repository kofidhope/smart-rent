import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {Home, Building2, CalendarDays, CreditCard, LogOut, Menu, User, Shield,} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import Button from '../ui/Button'
import MobileDrawer from '../ui/MobileDrawer'

// First initial of the user's first name — shown
// inside the avatar circle when no photo is uploaded.
function getInitial(name) {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

export default function Navbar() {
    const {user, isAuthenticated, isTenant, isLandlord, isAdmin, logout,} = useAuth()

    const location = useLocation()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    const handleLogout = async () => {
        setLoggingOut(true)
        await logout()
    }

    // Links per role
    const tenantLinks = [
        {
            to: '/properties',
            label: 'Browse',
            icon: Building2,
        },
        {
            to: '/tenant/dashboard',
            label: 'Dashboard',
            icon: Home,
        },
        {
            to: '/tenant/bookings',
            label: 'Bookings',
            icon: CalendarDays,
        },
        {
            to: '/tenant/payments',
            label: 'Payments',
            icon: CreditCard,
        },
    ]

    const landlordLinks = [
        {
            to: '/properties',
            label: 'Browse',
            icon: Building2,
        },
        {
            to: '/landlord/dashboard',
            label: 'Dashboard',
            icon: Home,
        },
        {
            to: '/landlord/properties',
            label: 'My Properties',
            icon: Building2,
        },
    ]

    const adminLinks = [
        {
            to: '/admin/dashboard',
            label: 'Dashboard',
            icon: Shield,
        },
        {
            to: '/admin/verification',
            label: 'Verification',
            icon: User,
        },
    ]

    const guestLinks = [
        {
            to: '/properties',
            label: 'Browse',
            icon: Building2,
        },
    ]

    const links = isAdmin ? adminLinks : isLandlord ? landlordLinks : isTenant ? tenantLinks : guestLinks

    const isActive = (path) =>
        location.pathname === path
        || location.pathname.startsWith(path + '/')

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-2 flex-shrink-0"
                        aria-label="SmartRent home">
                        <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">SR</span>
                        </div>
                        <span className="text-gray-900 font-bold text-lg hidden sm:block">
                            SmartRent
                        </span>
                    </Link>

                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map(({ to, label, icon: Icon }) => {
                            const active = isActive(to)
                            return (
                                <Link
                                    key={to}
                                    to={to}
                                    aria-current={active ? 'page' : undefined}
                                    className={`
                                        relative flex items-center
                                        gap-1.5 px-3 py-2
                                        rounded-lg text-sm font-medium
                                        transition-colors duration-150
                                        ${active
                                            ? 'text-brand-green'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }
                                    `}>
                                    <Icon className="h-4 w-4" />
                                    {label}
                                    {/* Active indicator — small
                                        underline at the bottom of
                                        the link for clear visual
                                        feedback beyond colour. */}
                                    {active && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute
                                                left-3 right-3
                                                -bottom-0.5 h-0.5
                                                bg-brand-green
                                                rounded-full" />
                                    )}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Right side */}
                    <div className="hidden md:flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                {/* Avatar circle + name */}
                                <div className="flex items-center gap-2">
                                    <div
                                        aria-hidden="true"
                                        className="w-9 h-9 bg-brand-green
                                            rounded-full flex items-center
                                            justify-center text-white
                                            font-semibold text-sm">
                                        {getInitial(user.firstName)}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {user.firstName} {user.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {user.role}
                                        </p>
                                    </div>
                                </div>

                                {/* Logout */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    loading={loggingOut}
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-4 w-4" />
                                        Logout
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button variant="primary" size="sm">
                                        Register
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label={
                            mobileOpen ? 'Close menu'
                                : 'Open menu'
                        }
                        aria-expanded={mobileOpen}
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                </div>
            </div>

            {/* ── Mobile menu — uses MobileDrawer so the sheet
                 always fits the viewport on small phones,
                 closes on swipe-down and on link tap. */}
            <MobileDrawer
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                title="Menu"
                ariaLabel="Main menu">
                <div className="space-y-1">

                    {links.map(({ to, label, icon: Icon }) => {
                        const active = isActive(to)
                        return (
                            <Link
                                key={to}
                                to={to}
                                onClick={() => setMobileOpen(false)}
                                aria-current={active ? 'page' : undefined}
                                className={`
                                    flex items-center gap-2.5
                                    px-3 py-2.5
                                    rounded-lg text-body font-medium
                                    transition-colors duration-150
                                    ${active
                                        ? 'bg-brand-light text-brand-green'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }
                                `}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </Link>
                        )
                    })}

                    <div className="pt-3 mt-1 border-t border-gray-100">
                        {isAuthenticated ? (
                            <>
                                <div className="flex items-center gap-3 px-3 py-2">
                                    <div
                                        aria-hidden="true"
                                        className="w-9 h-9 bg-brand-green
                                            rounded-full flex items-center
                                            justify-center text-white
                                            font-semibold text-sm">
                                        {getInitial(user.firstName)}
                                    </div>
                                    <div>
                                        <p className="text-body font-semibold
                                            text-gray-900">
                                            {user.firstName} {user.lastName}
                                        </p>
                                        <p className="text-meta text-gray-500">
                                            {user.role}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    disabled={loggingOut}
                                    className="w-full flex items-center gap-2
                                        px-3 py-2.5 rounded-lg
                                        text-body font-medium
                                        text-danger-text
                                        hover:bg-danger-bg
                                        disabled:opacity-60
                                        transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {loggingOut
                                        ? 'Logging out...'
                                        : 'Logout'}
                                </button>
                            </>
                        ) : (
                            <div className="flex gap-2 pt-1">
                                <Link
                                    to="/login"
                                    className="flex-1"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <Button variant="secondary" fullWidth>
                                        Login
                                    </Button>
                                </Link>
                                <Link
                                    to="/register"
                                    className="flex-1"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <Button variant="primary" fullWidth>
                                        Register
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </MobileDrawer>
        </nav>
    )
}
