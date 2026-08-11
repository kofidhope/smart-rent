// ─────────────────────────────────────────────────────
// SKELETON
//
// Thin wrappers around the .skeleton* design-system
// classes. Use these instead of hand-rolling grey bars.
// ─────────────────────────────────────────────────────

export function SkeletonText({
                                 width = 'w-full',
                                 className = '',
                             }) {
    return (
        <div
            className={`skeleton-text ${width} ${className}`}
            aria-hidden="true"
        />
    )
}

export function SkeletonRow({
                                height = 'h-4',
                                width = 'w-full',
                                className = '',
                            }) {
    return (
        <div
            className={`skeleton-row ${height} ${width} ${className}`}
            aria-hidden="true"
        />
    )
}

export function SkeletonImage({
                                  height = 'h-48',
                                  className = '',
                              }) {
    return (
        <div
            className={`skeleton-image w-full ${height} ${className}`}
            aria-hidden="true"
        />
    )
}

export function PropertyCardSkeleton() {
    return (
        <div className="card p-0 overflow-hidden" aria-hidden="true">
            <SkeletonImage height="h-56" />
            <div className="p-4 space-y-3">
                <SkeletonRow width="w-1/3" />
                <SkeletonText />
                <SkeletonText width="w-2/3" />
                <div className="pt-2 border-t border-gray-100 flex justify-between">
                    <SkeletonRow width="w-1/4" />
                    <SkeletonRow width="w-1/4" />
                </div>
            </div>
        </div>
    )
}
