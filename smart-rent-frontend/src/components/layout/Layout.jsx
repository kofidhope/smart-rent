import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

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

            {/* Navbar appears on every page */}
            <Navbar />

            {/* Page content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-brand-green rounded-md flex items-center justify-center">
                            <span className="text-white text-xs font-bold">SR</span>
                        </div>
                             <span className="text-sm font-medium text-gray-900">
                                 SmartRent
                             </span>
                        </div>
                    <p className="text-xs text-gray-400">
                        © {new Date().getFullYear()} SmartRent.
                        Find your perfect home in Ghana.
                    </p>
                </div>
            </footer>

        </div>
    )
}