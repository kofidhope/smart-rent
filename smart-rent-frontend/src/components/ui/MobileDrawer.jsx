import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─────────────────────────────────────────────────────
// MOBILE DRAWER
//
// Used by PropertiesPage filters and Navbar mobile menu.
// Slides up from the bottom, has a draggable handle so
// the user can swipe down to dismiss past a 120 px
// threshold. Closes on overlay click and on ESC.
//
// Backdrop is rendered separately so the page can
// decide its own z-index / darken level.
// ─────────────────────────────────────────────────────

const DISMISS_THRESHOLD = 120

export default function MobileDrawer({
                                          open,
                                          onClose,
                                          children,
                                          title,
                                          ariaLabel,
                                      }) {
    // ESC handling
    useEffect(() => {
        if (!open) return
        const handler = e => {
            if (e.key === 'Escape') onClose?.()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [open, onClose])

    // Lock body scroll while open
    useEffect(() => {
        if (!open) return
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previous
        }
    }, [open])

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={ariaLabel || title}
                        className="fixed bottom-0 left-0 right-0 z-modal bg-white rounded-t-2xl shadow-card-active max-h-[90dvh] flex flex-col"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{
                            duration: 0.22,
                            ease: [0.0, 0, 0.2, 1],
                        }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDragEnd={(e, info) => {
                            if (
                                info.offset.y > DISMISS_THRESHOLD ||
                                info.velocity.y > 500
                            ) {
                                onClose?.()
                            }
                        }}
                    >
                        <div className="drawer-handle cursor-grab active:cursor-grabbing" />
                        {title && (
                            <div className="px-5 pb-3 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {title}
                                </h2>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto p-5">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
