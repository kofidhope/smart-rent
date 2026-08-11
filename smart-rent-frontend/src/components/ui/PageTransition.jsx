import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

// ─────────────────────────────────────────────────────
// PAGE TRANSITION
//
// Wraps <Outlet/> with a 180 ms opacity crossfade so
// route changes feel continuous. mode="wait" ensures
// the outgoing page finishes before the incoming one
// starts to keep the layout stable.
// ─────────────────────────────────────────────────────

export default function PageTransition({ children }) {
    const location = useLocation()

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ minHeight: '100%' }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}
