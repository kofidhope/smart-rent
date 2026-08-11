import Button from './Button'

// ─────────────────────────────────────────────────────
// EMPTY STATE
//
// One canonical empty-state shape, replacing the four
// hand-rolled versions that existed across pages.
// Pass an icon, a title, a short description, and an
// optional CTA.
// ─────────────────────────────────────────────────────

export default function EmptyState({
                                        icon: Icon,
                                        title,
                                        description,
                                        actionLabel,
                                        onAction,
                                        className = '',
                                    }) {
    return (
        <div className={`empty-state ${className}`}>
            {Icon && <Icon className="empty-state-icon" />}
            {title && <h3 className="empty-state-title">{title}</h3>}
            {description && (
                <p className="empty-state-text">{description}</p>
            )}
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="secondary">
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}
