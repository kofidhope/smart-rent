import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {SlidersHorizontal, ChevronLeft, ChevronRight, SaveAll, ChevronDown,
} from 'lucide-react'
import PropertyService from '../../services/property.service'
import PropertyCard from '../../components/property/PropertyCard'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import EmptyState from '../../components/ui/EmptyState'
import ImagePlaceholder from '../../components/ui/ImagePlaceholder'
import MobileDrawer from '../../components/ui/MobileDrawer'
import { Stagger, StaggerItem } from '../../components/ui/Stagger'
import toast from 'react-hot-toast'

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
        <form onSubmit={onSubmit} className="space-y-5">
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

            <div className="flex gap-3 pt-3">
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
        mapBounds:   null, // { north, south, east, west }
    })

    // ── Results state ────────────────────────────────
    const [properties, setProperties] = useState([])
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [currentPage, setCurrentPage] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [mapInitialized, setMapInitialized] = useState(false)
    const mapRef = useRef(null)
    const [savedSearches, setSavedSearches] = useState([])
    const [showSaveSearch, setShowSaveSearch] = useState(false)
    const [searchName, setSearchName] = useState('')

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
            // Add map bounds if available
            if (currentFilters.mapBounds) {
                const { north, south, east, west } = currentFilters.mapBounds
                params.north = north
                params.south = south
                params.east = east
                params.west = west
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
            // Parse map bounds from URL if present
            mapBounds: searchParams.get('north') && searchParams.get('south') &&
                      searchParams.get('east') && searchParams.get('west') ? {
                north: Number(searchParams.get('north')),
                south: Number(searchParams.get('south')),
                east: Number(searchParams.get('east')),
                west: Number(searchParams.get('west'))
            } : null,
        }
        setFilters(nextFilters)
        fetchProperties(nextFilters, currentPage)
    }, [currentPage, searchParams, fetchProperties])

    // Initialize map when component mounts
    // In production, this would initialize a react-leaflet map
    useEffect(() => {
        // Simulate map initialization
        // In real implementation:
        // const map = L.map(mapRef.current).setView([lat, lng], zoom);
        // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //   attribution: '&copy; OpenStreetMap contributors'
        // }).addTo(map);
        //
        // map.on('moveend', () => {
        //   const bounds = map.getBounds();
        //   const { north, south, east, west } = bounds;
        //   setFilters(prev => ({
        //     ...prev,
        //     mapBounds: { north, south, east, west }
        //   }));
        //   // Update URL params
        //   const params = new URLSearchParams();
        //   // ... add other filters
        //   params.set('north', north);
        //   params.set('south', south);
        //   params.set('east', east);
        //   params.set('west', west);
        //   // ... add other filters to params
        //   // Update URL without triggering another useEffect
        //   window.history.replaceState(null, '',
        //     `${window.location.pathname}?${params.toString()}`);
        //   setCurrentPage(0);
        //   fetchProperties({ ...filters, mapBounds: { north, south, east, west } }, 0);
        // });

        // For demo purposes, we'll just set mapInitialized to true
        setMapInitialized(true);

        // Cleanup function
        return () => {
          // In real implementation: map.remove();
        };
    }, [filters]); // Re-run when filters change to simulate map updates

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
        // Add map bounds to URL params if available
        if (filters.mapBounds) {
            const { north, south, east, west } = filters.mapBounds
            params.north = north
            params.south = south
            params.east = east
            params.west = west
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
            mapBounds: null,
        })
        setSearchParams({})
        setCurrentPage(0)
        setShowFilters(false)
    }

    const handleMapReset = () => {
        // In a real implementation with react-leaflet, this would:
        // 1. Reset the map view to a default location or show all results
        // 2. Update the map bounds in filters
        // 3. Trigger a search

        // For now, we'll clear the map bounds and search
        setFilters(prev => ({
            ...prev,
            mapBounds: null
        }))
        setSearchParams(prev => {
            const { mapBounds, ...rest } = prev
            return rest
        })
        setCurrentPage(0)
        // Note: In a real implementation, we would call fetchProperties here
        // But since the useEffect responds to searchParams changes, it will happen automatically
    }

    // Save current search
    const handleSaveSearch = (e) => {
        e.preventDefault()
        if (!searchName.trim()) {
            toast.error('Please enter a name for your search')
            return
        }

        // Check if search with this name already exists
        const exists = savedSearches.some(search =>
            search.name.toLowerCase() === searchName.trim().toLowerCase()
        )

        if (exists) {
            if (!window.confirm('A search with this name already exists. Overwrite it?')) {
                return
            }
        }

        // Create a serializable copy of filters (remove non-serializable items if any)
        const filtersToSave = {
            city: filters.city,
            type: filters.type,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            minBedrooms: filters.minBedrooms,
            mapBounds: filters.mapBounds
        }

        const newSearch = {
            id: Date.now(),
            name: searchName.trim(),
            filters: filtersToSave,
            createdAt: new Date().toISOString()
        }

        // Update or add the search
        const updatedSearches = savedSearches.map(search =>
            search.name.toLowerCase() === searchName.trim().toLowerCase() ? newSearch : search
        )

        if (!exists) {
            setSavedSearches([...savedSearches, newSearch])
        } else {
            setSavedSearches(updatedSearches)
        }

        // Reset form
        setShowSaveSearch(false)
        setSearchName('')
        toast.success('Search saved!')
    }

    // Load a saved search
    const handleLoadSearch = (search) => {
        setFilters(search.filters)
        // Update URL params
        const params = new URLSearchParams()
        if (search.filters.city) params.set('city', search.filters.city)
        if (search.filters.type) params.set('type', search.filters.type)
        if (search.filters.minPrice) params.set('minPrice', search.filters.minPrice)
        if (search.filters.maxPrice) params.set('maxPrice', search.filters.maxPrice)
        if (search.filters.minBedrooms) params.set('minBedrooms', search.filters.minBedrooms)
        if (search.filters.mapBounds) {
            const { north, south, east, west } = search.filters.mapBounds
            params.set('north', north)
            params.set('south', south)
            params.set('east', east)
            params.set('west', west)
        }
        setSearchParams(params)
        setCurrentPage(0)
        toast.success(`Loaded search: ${search.name}`)
    }

    // Delete a saved search
    const handleDeleteSearch = (id) => {
        if (window.confirm('Are you sure you want to delete this search?')) {
            setSavedSearches(savedSearches.filter(search => search.id !== id))
            toast.success('Search deleted')
        }
    }

    const hasActiveFilters = Object.values(filters)
        .some(v => v !== '')

    return (
        <div className="page-container">

            {/* Page header */}
            <div className="flex items-end
                      justify-between mb-8 gap-4">
                <div>
                    <span className="eyebrow">Browse</span>
                    <h1 className="mt-3 text-3xl sm:text-4xl
                               font-bold text-gray-900
                               tracking-tight">
                        Properties
                    </h1>
                    {!loading && (
                        <p className="text-gray-500 mt-2 text-meta">
                            {totalElements.toLocaleString()} {totalElements === 1
                                ? 'property'
                                : 'properties'} found
                        </p>
                    )}

                    {/* Saved searches */}
                    {savedSearches.length > 0 && (
                        <div className="mt-4">
                            <button
                                onClick={() => setShowSaveSearch(!showSaveSearch)}
                                className="flex items-center gap-2 text-sm
                                       text-gray-600 hover:text-gray-800
                                       border border-gray-200 rounded px-3 py-1.5
                                       hover:bg-gray-50"
                            >
                                <SaveAll className="h-4 w-4" />
                                <span>Saved Searches</span>
                                <ChevronDown className="h-3 w-3" />
                            </button>

                            {showSaveSearch && (
                                <div className="mt-2 w-full bg-white rounded-lg
                                                       shadow-lg border border-gray-200
                                                       z-20">
                                    <div className="px-4 py-3">
                                        <p className="text-sm font-medium
                                               text-gray-900 mb-2">
                                            Save current search
                                        </p>
                                        <form onSubmit={handleSaveSearch}
                                              className="space-y-2">
                                            <input
                                                type="text"
                                                value={searchName}
                                                onChange={(e) => setSearchName(e.target.value)}
                                                placeholder="Enter search name"
                                                className="input w-full"
                                                autoFocus
                                            />
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowSaveSearch(false)
                                                        setSearchName('')
                                                    }}
                                                    className="btn-secondary text-sm"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="btn-primary text-sm"
                                                >
                                                    Save Search
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Saved searches list */}
                    {savedSearches.length > 0 && !showSaveSearch && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-900">
                                    Saved Searches
                                </h3>
                                {savedSearches.length > 0 && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Delete all saved searches?')) {
                                                setSavedSearches([])
                                                toast.success('All searches deleted')
                                            }
                                        }}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {savedSearches.map(search => (
                                    <div key={search.id}
                                         className="p-3 bg-gray-50 rounded-lg
                                                border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <SaveAll className="h-4 w-4 text-brand-green" />
                                                <div>
                                                    <p className="text-sm font-medium
                                                       text-gray-900">{search.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Saved {new Date(search.createdAt)
                                                            .toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleLoadSearch(search)}
                                                    className="text-xs text-blue-600
                                                           hover:text-blue-800"
                                                >
                                                    Load
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSearch(search.id)}
                                                    className="text-xs text-red-600
                                                           hover:text-red-800"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
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

            <div className="flex gap-8">

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
                                text-gray-900 mb-5">
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

                    {/* Map Search */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Map Search
                            </h2>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMapReset}
                            >
                                Recenter
                            </Button>
                        </div>
                        {/* Map container - in production, this would use react-leaflet */}
                        <div
                            ref={mapRef}
                            className="h-96 w-full rounded-xl bg-gray-100
                                     relative overflow-hidden"
                        >
                            {!mapInitialized ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                    <img
                                        src="https://source.unsplash.com/random/400x400?building,house"
                                        alt="Map placeholder"
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.src = 'https://source.unsplash.com/random/400x400?real-estate,property';
                                        }}
                                    />
                                    <p className="text-sm">
                                        Map search requires react-leaflet dependency
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        To implement: npm install react-leaflet leaflet
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0">
                                <div className="h-full w-full" />
                                <div className="absolute top-4 left-4 right-4 flex justify-between">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleMapReset}
                                    >
                                        Recenter
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            // In real implementation: get user's location
                                            toast.info('Geolocation functionality would be implemented with react-leaflet')
                                        }}
                                    >
                                        My Location
                                    </Button>
                                </div>
                            </div>
                        )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            In a real implementation, dragging the map would update the search area
                        </p>
                    </div>

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
                            image={<ImagePlaceholder title="No properties found" type="building" />}
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