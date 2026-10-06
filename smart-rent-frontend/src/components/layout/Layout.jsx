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
                <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12">

                    {/* Trust strip — quiet, text-only.
                        Replaces placeholder logos with
                        honest statements about partners. */}
                    <div className="pb-8 mb-8 border-b border-gray-100
                                flex flex-col sm:flex-row
                                items-start sm:items-center
                                gap-4 sm:gap-8">
                        <span className="eyebrow">Trusted by</span>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-meta text-gray-500">
                            <span className="font-semibold text-gray-700 tracking-tight">
                                Paystack
                            </span>
                            <span aria-hidden="true" className="text-gray-300">·</span>
                            <span className="font-semibold text-gray-700 tracking-tight">
                                Twilio
                            </span>
                            <span aria-hidden="true" className="text-gray-300">·</span>
                            <span className="font-semibold text-gray-700 tracking-tight">
                                Cloudinary
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-brand-green rounded-md flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                        SR
                                    </span>
                                </div>
                                <span className="text-base font-semibold text-gray-900 tracking-tight">
                                    SmartRent
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                                Ghana's rental marketplace. Find your next home
                                with verified listings and secure payments.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-meta uppercase tracking-[0.18em]
                                       font-medium text-gray-500 mb-4">
                                Product
                            </h3>
                            <ul className="space-y-2.5 text-sm text-gray-500">
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
                            <h3 className="text-meta uppercase tracking-[0.18em]
                                       font-medium text-gray-500 mb-4">
                                Support
                            </h3>
                            <ul className="space-y-2.5 text-sm text-gray-500">
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

                    <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
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
