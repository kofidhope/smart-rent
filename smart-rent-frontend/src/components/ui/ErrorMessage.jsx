import { AlertCircle } from 'lucide-react'

export default function ErrorMessage({message, className = '',}) {
    if (!message) return null

    return (
        <div
            // role="alert" makes screen readers
            // announce this immediately when it appears
            role="alert"
            aria-live="polite"
            className={`alert-danger ${className}`}
        >
            <AlertCircle
                className="h-4 w-4 mt-0.5 flex-shrink-0"
                aria-hidden="true"
            />
            <span>{message}</span>
        </div>
    )
}