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

          {/* ── FILTER SIDEBAR ──────────────────────── */}
          <aside className={`
          ${showFilters ? 'block' : 'hidden'}
          sm:block w-full sm:w-64 flex-shrink-0
        `}>
            <div className="card sticky top-20">
              <div className="flex items-center
                            justify-between mb-4">
                <h2 className="font-semibold text-gray-900">
                  Filters
                </h2>
                {hasActiveFilters && (
                    <button
                        onClick={handleClearFilters}
                        className="text-xs text-red-500
                             hover:text-red-700
                             flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Clear all
                    </button>
                )}
              </div>

              <form
                  onSubmit={handleSearch}
                  className="space-y-5"
              >

                {/* City */}
                <div>
                  <label className="label">City</label>
                  <input
                      type="text"
                      placeholder="e.g. Accra"
                      value={filters.city}
                      onChange={(e) =>
                          setFilters(f => ({
                            ...f,
                            city: e.target.value,
                          }))
                      }
                      className="input"
                  />
                </div>

                {/* Property type */}
                <div>
                  <label className="label">
                    Property type
                  </label>
                  <select
                      value={filters.type}
                      onChange={(e) =>
                          setFilters(f => ({
                            ...f,
                            type: e.target.value,
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

                {/* Price range */}
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
                              ...f,
                              minPrice: e.target.value,
                            }))
                        }
                        className="input"
                        min="0"
                    />
                    <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) =>
                            setFilters(f => ({
                              ...f,
                              maxPrice: e.target.value,
                            }))
                        }
                        className="input"
                        min="0"
                    />
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="label">
                    Min bedrooms
                  </label>
                  <select
                      value={filters.minBedrooms}
                      onChange={(e) =>
                          setFilters(f => ({
                            ...f,
                            minBedrooms: e.target.value,
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

                <Button type="submit" fullWidth>
                  Apply filters
                </Button>

              </form>
            </div>
          </aside>

          {/* ── PROPERTY GRID ────────────────────────── */}
          <div className="flex-1 min-w-0">

            <ErrorMessage
                message={error}
                className="mb-4"
            />

            {loading ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner size="lg" />
                </div>
            ) : properties.length === 0 ? (
                <div className="text-center py-20">
                  <Building2 className="h-16 w-16
                                    text-gray-200
                                    mx-auto mb-4" />
                  <h3 className="text-lg font-semibold
                             text-gray-900 mb-2">
                    No properties found
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Try adjusting your filters
                  </p>
                  {hasActiveFilters && (
                      <Button
                          variant="secondary"
                          onClick={handleClearFilters}
                      >
                        Clear filters
                      </Button>
                  )}
                </div>
            ) : (
                <>
                  {/* Grid */}
                  <div className="grid grid-cols-1
                              md:grid-cols-2
                              xl:grid-cols-3 gap-5">
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
                                justify-center gap-2 mt-8">
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

                        <div className="flex items-center gap-1">
                          {Array.from(
                              { length: totalPages },
                              (_, i) => i
                          )
                              .filter(i =>
                                  Math.abs(i - currentPage) <= 2
                              )
                              .map(i => (
                                  <button
                                      key={i}
                                      onClick={() =>
                                          setCurrentPage(i)
                                      }
                                      className={`
                          w-8 h-8 rounded-lg text-sm
                          font-medium transition-colors
                          ${i === currentPage
                                          ? 'bg-brand-green text-white'
                                          : 'text-gray-600 hover:bg-gray-100'
                                      }
                        `}
                                  >
                                    {i + 1}
                                  </button>
                              ))}
                        </div>

                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={
                                currentPage === totalPages - 1
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