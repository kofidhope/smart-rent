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
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    }

    return (
        <button
            className={`
                        btn
                        ${variants[variant]}
                        ${sizes[size]}
                        ${fullWidth ? 'w-full' : ''}
                        ${className}
                    `}
            disabled={disabled || loading}
            {...rest}
        >
            {loading && (
                <LoadingSpinner
                    size="sm"
                    color={variant === 'primary' ? 'white' : 'gray'}
                />
            )}
            {children}
        </button>
    )
}