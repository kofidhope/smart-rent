// ─────────────────────────────────────────────────────
// BADGE COMPONENT
//
// Small coloured pill for status labels.
// Maps booking status, payment status, property
// status to appropriate colours automatically.
//
// Usage:
//   <Badge status="CONFIRMED" />
//   <Badge status="AVAILABLE" />
//   <Badge status="PAID" />
//   <Badge variant="green" label="Active" />
// ─────────────────────────────────────────────────────

// Automatic status → colour mapping
const statusMap = {
    // Booking statuses
    CONFIRMED:         'green',
    PAYMENT_INITIATED: 'yellow',
    PENDING:           'yellow',
    CANCELLED:         'red',
    COMPLETED:         'blue',

    // Payment statuses
    PAID:              'green',
    SUCCESS:           'green',
    PROCESSING:        'yellow',
    UNPAID:            'yellow',
    FAILED:            'red',
    REFUNDED:          'blue',

    // Property statuses
    AVAILABLE:         'green',
    RENTED:            'blue',
    MAINTENANCE:       'yellow',

    // Verification statuses
    APPROVED:          'green',
    REJECTED:          'red',
    NONE:              'gray',

    // Role badges
    LANDLORD:          'blue',
    TENANT:            'gray',
    ADMIN:             'red',
}

const variantClasses = {
    green:  'badge-green',
    yellow: 'badge-yellow',
    red:    'badge-red',
    blue:   'badge-blue',
    gray:   'badge-gray',
}

export default function Badge({status, label, variant,}) {
    // Determine colour from status or explicit variant
    const colour = variant || statusMap[status] || 'gray'

    // Display text — use label if provided,
    // otherwise format the status string
    const text = label || status?.replace(/_/g, ' ') || ''

    return (
        <span className={variantClasses[colour]}>
            {text}
        </span>
    )
}