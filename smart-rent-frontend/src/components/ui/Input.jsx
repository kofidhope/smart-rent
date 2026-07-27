import { forwardRef } from 'react'

const Input = forwardRef(function Input({
                                            label,
                                            error,
                                            leftIcon: LeftIcon,
                                            rightIcon: RightIcon,
                                            className = '',
                                            id,
                                            ...rest
                                        }, ref) {

    // Generate an id from label if none provided
    // so the label htmlFor links to the input
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
        <div className="w-full">

            {/* Label */}
            {label && (
                <label
                    htmlFor={inputId}
                    className="label"
                >
                    {label}
                </label>
            )}

            {/* Input wrapper — needed for icon positioning */}
            <div className="relative">

                {/* Left icon */}
                {LeftIcon && (
                    <div className="absolute inset-y-0 left-0
                          pl-3 flex items-center
                          pointer-events-none">
                        <LeftIcon className="h-4 w-4 text-gray-400" />
                    </div>
                )}

                {/* The actual input */}
                <input
                    id={inputId}
                    ref={ref}
                    className={`
                                input
                                ${error ? 'input-error' : ''}
                                ${LeftIcon ? 'pl-10' : ''}
                                ${RightIcon ? 'pr-10' : ''}
                                ${className}
                            `}
                    {...rest}
                />

                {/* Right icon */}
                {RightIcon && (
                    <div className="absolute inset-y-0 right-0
                          pr-3 flex items-center
                          pointer-events-none">
                        <RightIcon className="h-4 w-4 text-gray-400" />
                    </div>
                )}

            </div>

            {/* Error message */}
            {error && (
                <p className="error-text">{error}</p>
            )}

        </div>
    )
})

export default Input