import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {SlidersHorizontal, X, Building2, ChevronLeft, ChevronRight,
} from 'lucide-react'
import PropertyService from '../../services/property.service'
import PropertyCard from '../../components/property/PropertyCard'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'

const PROPERTY_TYPES = [
  'APARTMENT',
  'HOUSE',
  'STUDIO',
  'VILLA',
  'OFFICE',
]

const PAGE_SIZE = 9

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
  }

  const hasActiveFilters = Object.values(filters)
      .some(v => v !== '')

  return (
      <div className="page-container">

        {/* Page header */}
        <div className="flex items-center
                      justify-between mb-6">
          <div>
            <h1 className="page-title mb-0">
              Browse properties
            </h1>
            {!loading && (
                <p className="text-gray-500 text-sm mt-1">
                  {totalElements} properties found
                </p>
            )}
          </div>

          {/* Mobile filter toggle */}
          <Button
              variant="secondary"
              size="sm"
              className="sm:hidden"
              onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
                <span className="w-2 h-2 bg-brand-green
                             rounded-full" />
            )}
          </Button>
        </div>

        <div className="flex gap-6">

          {/* ── MOBILE FILTER BUTTON ──────────────── */}
          <div className="sm:hidden flex items-center
                justify-between mb-4">
            <p className="text-meta text-gray-500">
              {!loading && `${totalElements} properties`}
            </p>
            <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 px-3 py-2
               rounded-lg border border-gray-300
               text-body font-medium text-gray-700
               bg-white hover:bg-gray-50
               transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                  <span className="w-2 h-2 bg-brand-green
                       rounded-full" />
              )}
            </button>
          </div>

          {/* ── MOBILE BOTTOM SHEET DRAWER ────────── */}
          {/* Overlay */}
          {showFilters && (
              <div
                  className="overlay sm:hidden"
                  onClick={() => setShowFilters(false)}
                  aria-hidden="true"
              />
          )}

          {/* Drawer */}
          <div
              className={`
    drawer-bottom sm:hidden
    ${showFilters
                  ? 'translate-y-0'
                  : 'translate-y-full'
              }
  `}
              role="dialog"
              aria-modal="true"
              aria-label="Filter properties"
          >
            {/* Drag handle */}
            <div className="drawer-handle" />

            <div className="px-5 pb-6">
              <div className="flex items-center
                    justify-between mb-4">
                <h2 className="text-card-title text-gray-900">
                  Filters
                </h2>
                <button
                    onClick={() => setShowFilters(false)}
                    className="btn-icon"
                    aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Same filter form fields as desktop */}
              <form
                  onSubmit={handleSearch}
                  className="space-y-4"
              >
                <div>
                  <label className="label">City</label>
                  <input
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
                  <label className="label">Property type</label>
                  <select
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
                  <label className="label">Min bedrooms</label>
                  <select
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
                          onClick={handleClearFilters}
                          className="btn-secondary flex-1"
                      >
                        Clear
                      </button>
                  )}
                  <button
                      type="submit"
                      className="btn-primary flex-1"
                  >
                    Apply filters
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── DESKTOP SIDEBAR — filter form ───────────── */}
          <aside className="hidden sm:block w-64 flex-shrink-0">
            <div className="card sticky top-20">
              <h2 className="text-card-title text-gray-900 mb-4">
                Filters
              </h2>

              <form
                  onSubmit={handleSearch}
                  className="space-y-4"
              >
                <div>
                  <label className="label">City</label>
                  <input
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
                  <label className="label">Property type</label>
                  <select
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
                  <label className="label">Min bedrooms</label>
                  <select
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

                <div className="flex gap-2 pt-2">
                  {hasActiveFilters && (
                      <button
                          type="button"
                          onClick={handleClearFilters}
                          className="btn-secondary flex-1"
                      >
                        Clear
                      </button>
                  )}
                  <button
                      type="submit"
                      className="btn-primary flex-1"
                  >
                    Apply
                  </button>
                </div>
              </form>
            </div>
          </aside>

          {/* ── RESULTS COLUMN ─────────────────────────── */}
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
                <ErrorMessage message={error} className="mb-6" />
            )}

            {/* Empty state */}
            {!loading && !error && properties.length === 0 && (
                <div className="empty-state">
                  <Building2 className="empty-state-icon" />
                  <p className="empty-state-title">
                    No properties found
                  </p>
                  <p className="empty-state-text">
                    {hasActiveFilters
                        ? 'Try adjusting your filters'
                        : 'Check back later for new listings'}
                  </p>
                </div>
            )}

            {/* Results grid */}
            {!loading && !error && properties.length > 0 && (
                <>
                  <div className="grid grid-cols-1
                              md:grid-cols-2
                              xl:grid-cols-3 gap-6">
                    {properties.map(property => (
                        <PropertyCard
                            key={property.id}
                            property={property}
                        />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                      <div className="flex items-center
                                  justify-center
                                  gap-2 mt-8">
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

                        <span className="text-meta text-gray-500
                                     px-3">
                          Page {currentPage + 1} of {totalPages}
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