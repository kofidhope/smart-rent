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

export function StatTileSkeleton() {
    return (
        <div className="stat-tile" aria-hidden="true">
            <div className="flex items-center justify-between mb-3">
                <SkeletonRow width="w-20" height="h-3" />
                <SkeletonRow width="w-10" height="h-10" className="rounded-lg" />
            </div>
            <SkeletonRow width="w-16" height="h-7" className="mb-2" />
            <SkeletonRow width="w-24" height="h-3" />
        </div>
    )
}

export function PropertyGridSkeleton({ count = 6 }) {
    return (
        <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            aria-busy="true"
            aria-label="Loading properties"
        >
            {Array.from({ length: count }).map((_, index) => (
                <PropertyCardSkeleton key={index} />
            ))}
        </div>
    )
}

export function DashboardSkeleton({
    statCount = 4,
    statColumns = 'grid-cols-2 sm:grid-cols-4',
    listRows = 3,
}) {
    return (
        <div
            className="page-container"
            aria-busy="true"
            aria-label="Loading dashboard"
        >
            <div className="page-header-block space-y-3">
                <SkeletonRow width="w-24" height="h-3" />
                <SkeletonRow width="w-64" height="h-8" />
                <SkeletonRow width="w-48" height="h-4" />
            </div>

            <div className={`grid ${statColumns} gap-4 mb-10`}>
                {Array.from({ length: statCount }).map((_, index) => (
                    <StatTileSkeleton key={index} />
                ))}
            </div>

            <div className="card">
                <SkeletonRow width="w-32" height="h-5" className="mb-5" />
                <div className="divide-y divide-gray-100 -mx-6">
                    {Array.from({ length: listRows }).map((_, index) => (
                        <div key={index} className="px-6 py-4">
                            <SkeletonRow width="w-2/3" className="mb-2" />
                            <SkeletonRow width="w-1/3" height="h-3" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
