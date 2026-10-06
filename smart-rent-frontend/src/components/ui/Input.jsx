import { forwardRef, useId } from 'react'

const Input = forwardRef(function Input({
                                            label,
                                            error,
                                            helper,
                                            leftIcon: LeftIcon,
                                            rightIcon: RightIcon,
                                            required,
                                            className = '',
                                            id,
                                            ...rest
                                        }, ref) {

    // useId generates a unique stable ID for
    // linking label → input → error via aria
    const generatedId = useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    return (
        <div className="w-full">

            {label && (
                <label
                    htmlFor={inputId}
                    className={`label ${required
                        ? 'label-required' : ''}`}
                >
                    {label}
                </label>
            )}

            <div className="relative">

                {LeftIcon && (
                    <div className="absolute inset-y-0 left-0
                          pl-3 flex items-center
                          pointer-events-none">
                        <LeftIcon className={`h-4 w-4 ${
                            error ? 'text-danger-icon'
                                : 'text-gray-400'
                        }`} />
                    </div>
                )}

                <input
                    id={inputId}
                    ref={ref}
                    // aria-invalid tells screen readers
                    // this field has a validation error
                    aria-invalid={error ? 'true' : 'false'}
                    // aria-describedby links the input to
                    // its error or helper text by ID so
                    // screen readers read both together
                    aria-describedby={
                        error ? errorId
                            : helper ? helperId
                                : undefined
                    }
                    aria-required={required}
                    className={`
            input
            ${error ? 'input-error' : ''}
            ${LeftIcon ? 'pl-10' : ''}
            ${RightIcon ? 'pr-10' : ''}
            ${className}
          `}
                    {...rest}
                />

                {RightIcon && (
                    <div className="absolute inset-y-0 right-0
                          pr-3 flex items-center
                          pointer-events-none">
                        <RightIcon className="h-4 w-4
                                   text-gray-400" />
                    </div>
                )}

            </div>

            {/* Error — linked via aria-describedby */}
            {error && (
                <p
                    id={errorId}
                    role="alert"
                    className="error-text"
                >
                    {/* Small dot before error for visual clarity */}
                    <span className="w-1.5 h-1.5 rounded-full
                           bg-danger-icon
                           flex-shrink-0 mt-0.5" />
                    {error}
                </p>
            )}

            {/* Helper text — shown when no error */}
            {helper && !error && (
                <p id={helperId} className="helper-text">
                    {helper}
                </p>
            )}

        </div>
    )
})

export default Input