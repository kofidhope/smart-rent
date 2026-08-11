import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {SlidersHorizontal, Building2, ChevronLeft, ChevronRight,
} from 'lucide-react'
import PropertyService from '../../services/property.service'
import PropertyCard from '../../components/property/PropertyCard'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import EmptyState from '../../components/ui/EmptyState'
import MobileDrawer from '../../components/ui/MobileDrawer'
import { Stagger, StaggerItem } from '../../components/ui/Stagger'

const PROPERTY_TYPES = [
  'APARTMENT',
  'HOUSE',
  'STUDIO',
  'VILLA',
  'OFFICE',
]

const PAGE_SIZE = 9

// Shared filter form — used in both desktop sidebar and
// mobile drawer so the two views can't drift apart.
function FilterForm({
                       filters,
                       setFilters,
                       hasActiveFilters,
                       onSubmit,
                       onClear,
                       submitLabel = 'Apply',
                       clearLabel = 'Clear',
                   }) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="label" htmlFor="filter-city">City</label>
                <input
                    id="filter-city"
                    type="text"
                    placeholder="e.g. Accra"
                    value={filters.city}
                    onChange={(e) =>
                        setFilters(f => ({
                            ...f, city: e.target.value,
                        }))
                    }
                    className="input"
                />
            </div>

            <div>
                <label className="label" htmlFor="filter-type">
                    Property type
                </label>
                <select
                    id="filter-type"
                    value={filters.type}
                    onChange={(e) =>
                        setFilters(f => ({
                            ...f, type: e.target.value,
                        }))
                    }
                    className="input"
                >
                    <option value="">All types</option>
                    {PROPERTY_TYPES.map(type => (
                        <option key={type} value={type}>
                            {type.charAt(0) +
                                type.slice(1).toLowerCase()}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="label">
                    Price range (GHS/month)
                </label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        aria-label="Minimum price"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) =>
                            setFilters(f => ({
                                ...f, minPrice: e.target.value,
                            }))
                        }
                        className="input"
                    />
                    <input
                        type="number"
                        aria-label="Maximum price"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) =>
                            setFilters(f => ({
                                ...f, maxPrice: e.target.value,
                            }))
                        }
                        className="input"
                    />
                </div>
            </div>

            <div>
                <label className="label" htmlFor="filter-bedrooms">
                    Min bedrooms
                </label>
                <select
                    id="filter-bedrooms"
                    value={filters.minBedrooms}
                    onChange={(e) =>
                        setFilters(f => ({
                            ...f, minBedrooms: e.target.value,
                        }))
                    }
                    className="input"
                >
                    <option value="">Any</option>
                    {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>
                            {n}+ bedroom{n > 1 ? 's' : ''}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex gap-3 pt-2">
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="btn-secondary flex-1"
                    >
                        {clearLabel}
                    </button>
                )}
                <button
                    type="submit"
                    className="btn-primary flex-1"
                >
                    {submitLabel}
                </button>
            </div>
        </form>
    )
}

export default function PropertiesPage() {
    const [searchParams, setSearchParams] =
        useSearchParams()

    // ── Filter state ─────────────────────────────────
    const [filters, setFilters] = useState({
        city:        searchParams.get('city') || '',
        type:        searchParams.get('type') || '',
        minPrice:    searchParams.get('minPrice') || '',
        maxPrice:    searchParams.get('maxPrice') || '',
        minBedrooms: searchParams.get('minBedrooms') || '',
    })

    // ── Results state ────────────────────────────────
    const [properties, setProperties] = useState([])
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [currentPage, setCurrentPage] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    // ── Fetch properties ──────────────────────────────
    const fetchProperties = useCallback(async (
        currentFilters,
        page
    ) => {
        setLoading(true)
        setError('')

        try {
            // Build params — only include non-empty values
            const params = { page, size: PAGE_SIZE }
            if (currentFilters.city) {
                params.city = currentFilters.city
            }
            if (currentFilters.type) {
                params.type = currentFilters.type
            }
            if (currentFilters.minPrice) {
                params.minPrice = Number(currentFilters.minPrice)
            }
            if (currentFilters.maxPrice) {
                params.maxPrice = Number(currentFilters.maxPrice)
            }
            if (currentFilters.minBedrooms) {
                params.minBedrooms = Number(
                    currentFilters.minBedrooms
                )
            }

            const result = await PropertyService.search(params)

            setProperties(result.content || [])
            setTotalPages(result.totalPages || 0)
            setTotalElements(result.totalElements || 0)

        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    // Fetch on mount, page change, and when URL query changes
    // (e.g. HomePage search navigates to /properties?city=Accra)
    useEffect(() => {
        const nextFilters = {
            city: searchParams.get('city') || '',
            type: searchParams.get('type') || '',
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
            minBedrooms: searchParams.get('minBedrooms') || '',
        }
        setFilters(nextFilters)
        fetchProperties(nextFilters, currentPage)
    }, [currentPage, searchParams, fetchProperties])

    const handleSearch = (e) => {
        e.preventDefault()
        setCurrentPage(0)

        // Sync filters to URL params — the URL effect loads results
        const params = {}
        if (filters.city) params.city = filters.city
        if (filters.type) params.type = filters.type
        if (filters.minPrice) params.minPrice = filters.minPrice
        if (filters.maxPrice) params.maxPrice = filters.maxPrice
        if (filters.minBedrooms) {
            params.minBedrooms = filters.minBedrooms
        }
        setSearchParams(params)
        setShowFilters(false)
    }

    const handleClearFilters = () => {
        setFilters({
            city: '',
            type: '',
            minPrice: '',
            maxPrice: '',
            minBedrooms: '',
        })
        setSearchParams({})
        setCurrentPage(0)
        setShowFilters(false)
    }

    const hasActiveFilters = Object.values(filters)
        .some(v => v !== '')

    return (
        <div className="page-container">

            {/* Page header */}
            <div className="flex items-center
                      justify-between mb-6 gap-4">
                <div>
                    <h1 className="page-title mb-0">
                        Browse properties
                    </h1>
                    {!loading && (
                        <p className="text-gray-500 text-sm mt-1">
                            {totalElements} {totalElements === 1
                                ? 'property'
                                : 'properties'} found
                        </p>
                    )}
                </div>

                {/* Mobile filter toggle */}
                <Button
                    variant="secondary"
                    size="sm"
                    className="sm:hidden flex-shrink-0"
                    onClick={() => setShowFilters(true)}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                        <span className="ml-1 w-2 h-2
                                 bg-brand-green rounded-full" />
                    )}
                </Button>
            </div>

            <div className="flex gap-6">

                {/* ── MOBILE FILTER DRAWER ───────────────── */}
                <MobileDrawer
                    open={showFilters}
                    onClose={() => setShowFilters(false)}
                    title="Filters"
                    ariaLabel="Filter properties"
                >
                    <FilterForm
                        filters={filters}
                        setFilters={setFilters}
                        hasActiveFilters={hasActiveFilters}
                        onSubmit={handleSearch}
                        onClear={handleClearFilters}
                        submitLabel="Apply filters"
                    />
                </MobileDrawer>

                {/* ── DESKTOP SIDEBAR — filter form ───────── */}
                <aside className="hidden sm:block w-64 flex-shrink-0">
                    <div className="card sticky top-24">
                        <h2 className="text-card-title
                                text-gray-900 mb-4">
                            Filters
                        </h2>

                        <FilterForm
                            filters={filters}
                            setFilters={setFilters}
                            hasActiveFilters={hasActiveFilters}
                            onSubmit={handleSearch}
                            onClear={handleClearFilters}
                        />
                    </div>
                </aside>

                {/* ── RESULTS COLUMN ──────────────────────── */}
                <div className="flex-1 min-w-0">

                    {/* Loading state */}
                    {loading && (
                        <div className="flex items-center
                                    justify-center py-16">
                            <LoadingSpinner size="lg" />
                        </div>
                    )}

                    {/* Error state */}
                    {!loading && error && (
                        <ErrorMessage
                            message={error}
                            className="mb-6"
                        />
                    )}

                    {/* Empty state */}
                    {!loading && !error && properties.length === 0 && (
                        <EmptyState
                            icon={Building2}
                            title="No properties found"
                            description={hasActiveFilters
                                ? 'Try adjusting your filters'
                                : 'Check back later for new listings'}
                            actionLabel={hasActiveFilters
                                ? 'Clear filters'
                                : undefined}
                            onAction={hasActiveFilters
                                ? handleClearFilters
                                : undefined}
                        />
                    )}

                    {/* Results grid */}
                    {!loading && !error && properties.length > 0 && (
                        <>
                            <Stagger
                                className="grid grid-cols-1
                                  md:grid-cols-2
                                  xl:grid-cols-3 gap-6"
                                itemDelay={0.05}
                                maxItems={PAGE_SIZE}
                            >
                                {properties.map(property => (
                                    <StaggerItem key={property.id}>
                                        <PropertyCard
                                            property={property}
                                        />
                                    </StaggerItem>
                                ))}
                            </Stagger>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center
                                  justify-center
                                  gap-3 mt-8">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled={currentPage === 0}
                                        onClick={() =>
                                            setCurrentPage(p => p - 1)
                                        }
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>

                                    <span className="text-meta
                                                 text-gray-500 px-2">
                                        Page {currentPage + 1}
                                        {' '}of{' '}{totalPages}
                                    </span>

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled={
                                            currentPage >= totalPages - 1
                                        }
                                        onClick={() =>
                                            setCurrentPage(p => p + 1)
                                        }
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                </div>
            </div>
        </div>
    )
}