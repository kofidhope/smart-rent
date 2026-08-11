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
            // aria-label gives screen readers
            // a meaningful description of the card
            aria-label={`View ${property.title} in ${
                property.city} — GHS ${
                property.price.toLocaleString()} per month`}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
        >

            {/* ── Image ───────────────────────────────── */}
            <div className="relative h-56 bg-gray-100
                      overflow-hidden">
                {property.primaryImageUrl ? (
                    <img
                        src={property.primaryImageUrl}
                        // Descriptive alt not just the title
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

                {/* Type badge */}
                <div className="absolute top-3 right-3">
                    <span className="badge badge-gray
                           bg-black/50 text-white
                           border-0">
                        {property.type.charAt(0) +
                            property.type.slice(1).toLowerCase()}
                    </span>
                </div>
            </div>

            {/* ── Content ─────────────────────────────── */}
            <div className="p-4 space-y-2">

                {/* Price — FIRST, most important info */}
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold
                           text-brand-green">
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
                <div className="flex items-center gap-1
                        text-meta text-gray-500">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="line-clamp-1">
                        {property.address}, {property.city}
                    </span>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 pt-2
                        flex items-center
                        justify-between gap-2">

                    {/* Bedrooms + bathrooms */}
                    <div className="flex items-center gap-3
                          text-meta text-gray-500">
                        <span className="flex items-center gap-1">
                            <BedDouble className="h-3.5 w-3.5" />
                            {property.bedrooms}
                        </span>
                        <span className="flex items-center gap-1">
                            <Bath className="h-3.5 w-3.5" />
                            {property.bathrooms}
                        </span>
                    </div>

                    {/* Owner — prefixed with icon for clarity */}
                    <span className="flex items-center gap-1
                           text-meta text-gray-400
                           truncate min-w-0">
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
