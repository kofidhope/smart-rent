import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import PageTransition from '../ui/PageTransition'

// ─────────────────────────────────────────────────────
// LAYOUT
//
// Wraps every page with the Navbar at the top.
// Outlet renders the matched child route.
// min-h-screen ensures the page fills the viewport
// even when content is short.
// ─────────────────────────────────────────────────────

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">

            {/* Skip link — first tab stop. Hidden until
                focused. Lets keyboard users jump past
                the navbar to main content. */}
            <a href="#main" className="skip-nav">
                Skip to main content
            </a>

            {/* Navbar appears on every page */}
            <Navbar />

            {/* Page content */}
            <main id="main" className="flex-1">
                <PageTransition>
                    <Outlet />
                </PageTransition>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-brand-green rounded-md flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                        SR
                                    </span>
                                </div>
                                <span className="text-base font-semibold text-gray-900">
                                    SmartRent
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 max-w-xs">
                                Ghana's rental marketplace. Find your next home
                                with verified listings and secure payments.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Product
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li>
                                    <a href="/properties" className="hover:text-brand-green transition-colors">
                                        Browse properties
                                    </a>
                                </li>
                                <li>
                                    <a href="/register" className="hover:text-brand-green transition-colors">
                                        Create account
                                    </a>
                                </li>
                                <li>
                                    <a href="/login" className="hover:text-brand-green transition-colors">
                                        Sign in
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Support
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li>
                                    <a
                                        href="mailto:support@smartrent.com"
                                        className="hover:text-brand-green transition-colors"
                                    >
                                        support@smartrent.com
                                    </a>
                                </li>
                                <li className="text-gray-400">
                                    Paystack-secured payments
                                </li>
                                <li className="text-gray-400">
                                    SMS notifications via Twilio
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                        <p className="text-xs text-gray-400">
                            © {new Date().getFullYear()} SmartRent.
                            All rights reserved.
                        </p>
                        <p className="text-xs text-gray-400">
                            Made in Ghana
                        </p>
                    </div>
                </div>
            </footer>

        </div>
    )
}
