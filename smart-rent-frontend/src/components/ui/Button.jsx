import LoadingSpinner from './LoadingSpinner'

export default function Button({
                                   children,
                                   variant = 'primary',
                                   size = 'md',
                                   loading = false,
                                   fullWidth = false,
                                   className = '',
                                   disabled,
                                   ...rest
                               }) {

    const variants = {
        primary:   'btn-primary',
        secondary: 'btn-secondary',
        danger:    'btn-danger',
        ghost:     'btn-ghost',
        icon:      'btn-icon',
    }

    const sizes = {
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
        xl: 'btn-xl',
    }

    return (
        <button
            className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            disabled={disabled || loading}
            // aria-busy tells screen readers the button
            // is processing — do not activate again
            aria-busy={loading}
            {...rest}
        >
            {loading && (
                <LoadingSpinner
                    size="sm"
                    color={variant === 'primary'
                        ? 'white' : 'gray'}
                />
            )}
            {/* Text stays visible during loading */}
            {/* It just dims via opacity on the wrapper */}
            <span className={loading ? 'opacity-60' : ''}>
        {children}
      </span>
        </button>
    )
}