import { useState } from 'react'

// ─────────────────────────────────────────────────────
// IMAGE PLACEHOLDER
// ─────────────────────────────────────────────────────
// A component that renders a real property photography placeholder
// using Unsplash Source, with fallback handling

export default function ImagePlaceholder({
  title = 'Property',
  type = 'real-estate',
  className = ''
}) {
  const [imageSrc, setImageSrc] = useState(
    `https://source.unsplash.com/random/800x600?${type},house`
  )

  return (
    <img
      src={imageSrc}
      alt={`${title} — placeholder`}
      className={`w-full h-full object-cover ${className}`}
      loading="lazy"
      onError={(e) => {
        // Fallback to abstract property image if specific search fails
        const fallbackSrc = 'https://source.unsplash.com/random/800x600?real-estate,property'
        if (e.target.src !== fallbackSrc) {
          e.target.src = fallbackSrc
        }
      }}
    />
  )
}