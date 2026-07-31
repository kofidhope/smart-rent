import { useNavigate } from 'react-router-dom'
import {BedDouble, Bath, MapPin, Building2,} from 'lucide-react'
import Badge from '../ui/Badge'

// ─────────────────────────────────────────────────────
// PROPERTY CARD
//
// Used in search results and landlord property lists.
// Clicking anywhere on the card navigates to the
// property detail page.
//
// Props:
//   property — full property object from the backend
// ─────────────────────────────────────────────────────

export default function PropertyCard({ property }) {
    const navigate = useNavigate()

    const handleClick = () => {
        navigate(`/properties/${property.id}`)
    }

    return (
        <div
            className="bg-white rounded-xl border
                 border-gray-100 shadow-sm
                 overflow-hidden cursor-pointer
                 hover:shadow-md hover:-translate-y-0.5
                 transition-all duration-200"
            onClick={handleClick}
        >
            {/* Property image */}
            <div className="relative h-48 bg-gray-100">
                {property.primaryImageUrl ? (
                    <img
                        src={property.primaryImageUrl}
                        alt={property.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    // Placeholder when no image uploaded
                    <div className="w-full h-full flex
                          flex-col items-center
                          justify-center
                          text-gray-300">
                        <Building2 className="h-12 w-12 mb-2" />
                        <span className="text-sm">No image</span>
                    </div>
                )}

                {/* Status badge on top of image */}
                <div className="absolute top-3 left-3">
                    <Badge status={property.status} />
                </div>

                {/* Property type badge */}
                <div className="absolute top-3 right-3">
                    <span className="badge bg-black/50 text-white text-xs">
                      {property.type}
                    </span>
                </div>
            </div>

            {/* Card content */}
            <div className="p-4">

                {/* Title */}
                <h3 className="font-semibold text-gray-900
                       text-base mb-1 line-clamp-1">
                    {property.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">
                        {property.address}, {property.city}
                    </span>
                </div>

                {/* Bedrooms and bathrooms */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                        <BedDouble className="h-4 w-4 text-gray-400" />
                        <span>
                            {property.bedrooms}{' '}
                            {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
                         </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4 text-gray-400" />
                        <span>
                            {property.bathrooms}{' '}
                            {property.bathrooms === 1 ? 'Bath' : 'Baths'}
                        </span>
                    </div>
                </div>

                {/* Price and owner */}
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xl font-bold text-brand-green">
                          GHS {Number(property.price || 0).toLocaleString()}
                        </span><span className="text-gray-400 text-sm">
                            /month
                        </span>
                    </div>

                    <span className="text-xs text-gray-400">
                        {property.ownerName}
                    </span>
                </div>

            </div>
        </div>
    )
}