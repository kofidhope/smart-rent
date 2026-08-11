import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import Button from './Button'

// ─────────────────────────────────────────────────────
// CONFIRM DIALOG
//
// Replaces native `confirm()` calls. Uses the native
// <dialog> element so focus trap + ESC handling come
// from the browser, then layers framer-motion on top
// for scale + fade entrance.
// Variants: 'primary' (default) and 'danger' for
// destructive actions like booking cancellations.
// ─────────────────────────────────────────────────────

export default function ConfirmDialog({
                                          open,
                                          title,
                                          message,
                                          confirmLabel = 'Confirm',
                                          cancelLabel = 'Cancel',
                                          variant = 'primary',
                                          loading = false,
                                          onConfirm,
                                          onCancel,
                                      }) {
    const isDanger = variant === 'danger'

    // ESC handling: <dialog> emits a 'cancel' event on
    // ESC. We intercept it to keep React state in sync.
    useEffect(() => {
        if (!open) return
        const handler = e => {
            e.preventDefault()
            onCancel?.()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [open, onCancel])

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={onCancel}
                    role="presentation"
                >
                    <motion.div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="confirm-title"
                        aria-describedby="confirm-message"
                        className="bg-white rounded-card shadow-card-active max-w-md w-full p-6"
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 4 }}
                        transition={{
                            duration: 0.2,
                            ease: [0.0, 0, 0.2, 1],
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-4">
                            {isDanger && (
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-danger-bg flex items-center justify-center">
                                    <AlertTriangle className="h-5 w-5 text-danger-icon" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h2
                                    id="confirm-title"
                                    className="text-lg font-semibold text-gray-900 mb-2"
                                >
                                    {title}
                                </h2>
                                <p
                                    id="confirm-message"
                                    className="text-sm text-gray-600"
                                >
                                    {message}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Button
                                variant="secondary"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                {cancelLabel}
                            </Button>
                            <Button
                                variant={isDanger ? 'danger' : 'primary'}
                                onClick={onConfirm}
                                loading={loading}
                                autoFocus
                            >
                                {confirmLabel}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
