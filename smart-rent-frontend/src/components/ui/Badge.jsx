// Status → semantic variant mapping
const statusMap = {
    // Booking
    CONFIRMED:         'success',
    PAYMENT_INITIATED: 'warning',
    PENDING:           'warning',
    CANCELLED:         'danger',
    COMPLETED:         'info',

    // Payment
    PAID:              'success',
    SUCCESS:           'success',
    PROCESSING:        'warning',
    FAILED:            'danger',
    REFUNDED:          'info',

    // Property
    AVAILABLE:         'success',
    RENTED:            'info',
    MAINTENANCE:       'warning',

    // Verification
    APPROVED:          'success',
    REJECTED:          'danger',
    NONE:              'gray',

    // Roles
    LANDLORD:          'info',
    TENANT:            'gray',
    ADMIN:             'danger',
}

// Dot colors per variant
const dotColors = {
    success: 'bg-success-icon',
    warning: 'bg-warning-icon',
    danger:  'bg-danger-icon',
    info:    'bg-info-icon',
    gray:    'bg-gray-400',
}

// Badge wrapper classes per variant
const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger:  'badge-danger',
    info:    'badge-info',
    gray:    'badge-gray',
}

export default function Badge({
                                  status,
                                  label,
                                  variant,
                                  className = '',
                              }) {
    const resolvedVariant = variant
        || statusMap[status]
        || 'gray'

    const text = label
        || status?.replace(/_/g, ' ')
        || ''

    return (
        <span
            className={`${variantClasses[resolvedVariant]} ${
                className}`}
            // role="status" for live regions
            // so screen readers announce status changes
            role="status"
        >
      {/* Colored dot — visible to color-blind users */}
            <span
                className={`badge-dot ${
                    dotColors[resolvedVariant]
                }`}
                aria-hidden="true"
            />
            {text}
    </span>
    )
}