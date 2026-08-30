import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    BedDouble,
    Bath,
    MapPin,
    Building2,
    User,
} from 'lucide-react'
import Badge from '../ui/Badge'

export default function PropertyCard({ property }) {
    const navigate = useNavigate()

    const handleNavigate = () => {
        navigate(`/properties/${property.id}`)
    }

    return (
        // button element makes this keyboard accessible
        // Users can Tab to it and press Enter/Space
        <motion.button
            type="button"
            onClick={handleNavigate}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleNavigate()
                }
            }}
            className="card-interactive text-left w-full
                 overflow-hidden p-0 rounded-card
                 group"
            aria-label={`View ${property.title} in ${
                property.city} — GHS ${
                property.price.toLocaleString()} per month`}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
        >

            {/* ── Image ─────────────────────────────── */}
            <div className="relative h-56 bg-gray-100
                      overflow-hidden">
                {property.primaryImageUrl ? (
                    <img
                        src={property.primaryImageUrl}
                        alt={`${property.title} — ${
                            property.type.toLowerCase()} in ${
                            property.city}`}
                        className="w-full h-full object-cover
                       transition-transform duration-300
                       group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col
                          items-center justify-center
                          text-gray-300 bg-gray-50">
                        <Building2 className="h-10 w-10 mb-2" />
                        <span className="text-meta">No photo</span>
                    </div>
                )}

                {/* Status badge */}
                <div className="absolute top-3 left-3">
                    <Badge status={property.status} />
                </div>

                {/* Type pill — quiet, glass-like */}
                <div className="absolute top-3 right-3">
                    <span className="badge bg-white/90 backdrop-blur-sm
                           text-gray-700 border border-white/40
                           shadow-sm">
                        {property.type.charAt(0) +
                            property.type.slice(1).toLowerCase()}
                    </span>
                </div>
            </div>

            {/* ── Content ─────────────────────────────── */}
            <div className="p-5 space-y-3">

                {/* Price — FIRST, most important info.
                    Tracking-tight so big numbers don't
                    dominate horizontally. */}
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold
                           text-gray-900
                           tracking-tight">
                        GHS {property.price.toLocaleString()}
                    </span>
                    <span className="text-meta text-gray-400">
                        /month
                    </span>
                </div>

                {/* Title — line-clamp-2 preserves location */}
                <h3 className="text-card-title text-gray-900
                       line-clamp-2 leading-snug">
                    {property.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1.5
                        text-meta text-gray-500">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="line-clamp-1">
                        {property.address}, {property.city}
                    </span>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 pt-3 mt-1
                        flex items-center
                        justify-between gap-2">

                    {/* Bedrooms + bathrooms — quieter */}
                    <div className="flex items-center gap-4
                          text-meta text-gray-500">
                        <span className="flex items-center gap-1">
                            <BedDouble className="h-3.5 w-3.5" />
                            <span className="text-gray-700 font-medium">
                                {property.bedrooms}
                            </span>
                            bed
                        </span>
                        <span className="flex items-center gap-1">
                            <Bath className="h-3.5 w-3.5" />
                            <span className="text-gray-700 font-medium">
                                {property.bathrooms}
                            </span>
                            bath
                        </span>
                    </div>

                    {/* Owner — prefixed with icon for clarity */}
                    <span className="flex items-center gap-1
                           text-meta text-gray-400
                           truncate min-w-0 max-w-[40%]">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                            {property.ownerName}
                        </span>
                    </span>
                </div>

            </div>
        </motion.button>
    )
}
