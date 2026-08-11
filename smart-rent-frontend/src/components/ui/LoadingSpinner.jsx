// Static maps so Tailwind's purge doesn't strip the
// class names. The previous version built
//   `border-t-${colors[color].split('-').slice(1).join('-')}`
// dynamically, which the compiler cannot see.
const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4',
}

const colorClasses = {
    brand: 'border-t-brand-green',
    white: 'border-t-white',
    gray:  'border-t-gray-400',
}

export default function LoadingSpinner({
                                           size = 'md',
                                           color = 'brand',
                                           className = '',
                                       }) {
    return (
        <div
            className={`
                animate-spin rounded-full
                border-gray-200
                ${sizeClasses[size]}
                ${colorClasses[color]}
                ${className}
            `}
            role="status"
            aria-label="Loading"
        />
    )
}
