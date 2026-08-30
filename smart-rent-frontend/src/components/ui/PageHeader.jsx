// ─────────────────────────────────────────────────────
// PAGE HEADER
//
// Shared dashboard / app-page title block:
// eyebrow + page title + optional description + actions.
// ─────────────────────────────────────────────────────

export default function PageHeader({
    eyebrow,
    title,
    description,
    actions,
    className = '',
}) {
    return (
        <div
            className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-10 ${className}`}
        >
            <div className="min-w-0">
                {eyebrow && (
                    <span className="eyebrow">{eyebrow}</span>
                )}
                <h1 className="mt-3 text-page tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-meta text-gray-500 mt-2 max-w-2xl">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex-shrink-0">{actions}</div>
            )}
        </div>
    )
}
