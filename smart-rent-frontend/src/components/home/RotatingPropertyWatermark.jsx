import {useEffect, useSyncExternalStore} from 'react'
import {
  subscribe,
  getSnapshot,
  setImageCount,
  pause,
  resume,
} from './watermarkController'

/**
 * <RotatingPropertyWatermark />
 * ----------------------------
 * A decorative watermark layer that shows rotating real property photography
 * instead of SVG illustrations. Mounts inside a parent that is `relative overflow-hidden`.
 * Multiple instances stay in sync via the shared WatermarkController store,
 * and they all freeze while any one of them is hovered.
 *
 * Props
 *   variant  - 'hero' | 'band'. Controls position, size, opacity.
 *   properties - Optional array of property objects to fetch images for.
 *                If not provided, uses default Unsplash property searches.
 *   fadeMs   - Optional crossfade duration override. Defaults to the
 *              controller's value (1200ms, or 0ms under reduced motion).
 */
export default function RotatingPropertyWatermark({
    variant = 'hero',
    properties,
    fadeMs,
}) {
    if (import.meta.env.DEV && variant !== 'hero' && variant !== 'band') {
        // eslint-disable-next-line no-console
        console.warn(
            `[RotatingPropertyWatermark] unknown variant "${variant}". ` +
                'Expected "hero" or "band". Rendering nothing.'
        )
    }
    const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

    // Declare our image count once on mount (and on change). The controller
    // is idempotent - calling this from every instance is safe.
    useEffect(() => {
        // Use the length of properties array if provided, otherwise default to 4
        const count = properties ? properties.length : 4
        setImageCount(count)
    }, [properties ? properties.length : undefined])

    const isHero = variant === 'hero'

    // Tailwind classes per variant. The `hero` variant uses a large single
    // silhouette off to the right; the `band` variant uses a tighter,
    // repeated tile so the section feels textured without dominating.
    const containerClasses = isHero
        ? 'absolute inset-0 pointer-events-none'
        : 'absolute inset-0 pointer-events-none overflow-hidden'

    const tintClasses = isHero
        ? // Hero sits on a green-to-gray gradient — use white at low opacity
          // so it reads as part of the existing brand palette.
          'text-brand-green/20'
        : // Band sits on bg-gray-50 — use a soft brand-green tint so the
          // watermark hints at the brand without competing with the text.
          'text-brand-green/10'

    const silhouetteLayoutClasses = isHero
        ? // Big image, right-aligned, vertically centered.
          'property-watermark-scene absolute inset-0'
        : // Tiled band: 4 images across the section, low opacity.
          'absolute inset-0 grid grid-cols-2 sm:grid-cols-4 ' +
          'items-center justify-items-center gap-6 ' +
          'px-6'

    return (
        <div
            className={containerClasses}
            aria-hidden="true"
            data-testid="rotating-property-watermark"
        >
            {/*
              The image layer is pointer-events-none so it never blocks
              clicks. The hover-sentinel below it (pointer-events-auto)
              owns the pause/resume calls.
            */}
            <div className={silhouetteLayoutClasses}>
                {[0, 1, 2, 3].map((i) => {
                    const isActive = state.index === i
                    // Determine which property to show based on index
                    const propertyIndex = properties && properties.length > 0
                        ? i % properties.length
                        : i
                    const propertyType = properties && properties.length > 0 && properties[propertyIndex]?.type
                        ? properties[propertyIndex].type.toLowerCase()
                        : ['house', 'building', 'apartment', 'villa'][i % 4]

                    return (
                        <div key={i} className="relative w-full h-full">
                            <img
                                src={`https://source.unsplash.com/random/800x600?${propertyType}`}
                                alt="Property"
                                className="w-full h-full object-cover"
                                loading={i === 0 ? 'eager' : 'lazy'}
                                onError={(e) => {
                                    e.target.src = 'https://source.unsplash.com/random/800x600?real-estate,property'
                                }}
                                style={{
                                    opacity: isActive ? 1 : 0,
                                    transitionDuration: `${
                                        fadeMs ?? state.fadeMs
                                    }ms`,
                                }}
                                className={`${tintClasses} w-full h-full object-cover transition-opacity ease-smooth ${
                                    isHero
                                        ? 'absolute inset-0 property-watermark-image'
                                        : 'max-h-[140px]'
                                }`}
                            />
                        </div>
                    )
                })}
            </div>

            {/* Hover sentinel — fills the section, catches pointer
                 events for pause/resume. Visually invisible. */}
            <div
                className="absolute inset-0"
                onMouseEnter={pause}
                onMouseLeave={resume}
                onFocus={pause}
                onBlur={resume}
            />
        </div>
    )
}