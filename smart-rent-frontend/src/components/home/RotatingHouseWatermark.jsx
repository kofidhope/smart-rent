import {useEffect, useSyncExternalStore} from 'react'
import house1 from '../../assets/watermark/house-1.svg'
import house2 from '../../assets/watermark/house-2.svg'
import house3 from '../../assets/watermark/house-3.svg'
import house4 from '../../assets/watermark/house-4.svg'
import {
    subscribe,
    getSnapshot,
    setImageCount,
    pause,
    resume,
} from './watermarkController'

/**
 * <RotatingHouseWatermark />
 * ---------------------------
 * A purely decorative, crossfading watermark layer that mounts inside a
 * parent that is `relative overflow-hidden`. Multiple instances stay in
 * sync via the shared WatermarkController store, and they all freeze
 * while any one of them is hovered.
 *
 * Props
 *   variant  - 'hero' | 'band'. Controls position, size, opacity, and
 *              which tint the silhouette uses.
 *   images   - Optional array of image URLs. Defaults to the four
 *              hand-authored SVGs in src/assets/watermark/.
 *   fadeMs   - Optional crossfade duration override. Defaults to the
 *              controller's value (1200ms, or 0ms under reduced motion).
 *
 * Accessibility
 *   - aria-hidden on the container and every <img> (decorative).
 *   - Empty alt="" so screen readers never announce the silhouettes.
 *   - prefers-reduced-motion is honored via the controller (10s interval,
 *     0ms crossfade).
 */
export default function RotatingHouseWatermark({
    variant = 'hero',
    images = [house1, house2, house3, house4],
    fadeMs,
}) {
    if (import.meta.env.DEV && variant !== 'hero' && variant !== 'band') {
        // eslint-disable-next-line no-console
        console.warn(
            `[RotatingHouseWatermark] unknown variant "${variant}". ` +
                'Expected "hero" or "band". Rendering nothing.',
        )
    }
    const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

    // Declare our image count once on mount (and on change). The controller
    // is idempotent — calling this from every instance is safe.
    useEffect(() => {
        setImageCount(images.length)
    }, [images.length])

    const isHero = variant === 'hero'

    // Tailwind classes per variant. The `hero` variant uses a large single
    // silhouette off to the right; the `band` variant uses a tighter,
    // repeated tile so the section feels textured without dominating.
    const containerClasses = isHero
        ? 'absolute inset-0 pointer-events-none overflow-hidden'
        : 'absolute inset-0 pointer-events-none overflow-hidden'

    const tintClasses = isHero
        ? // Hero sits on a green-to-gray gradient — use white at low opacity
          // so it reads as part of the existing brand palette.
          'text-white'
        : // Band sits on bg-gray-50 — use a soft brand-green tint so the
          // watermark hints at the brand without competing with the text.
          'text-brand-green'

    const silhouetteLayoutClasses = isHero
        ? // Big silhouette, right-aligned, vertically centered.
          'absolute right-[6%] top-1/2 -translate-y-1/2 ' +
          'w-[44%] max-w-[640px] aspect-[4/3] ' +
          'opacity-[0.10]'
        : // Tiled band: 4 silhouettes across the section, low opacity.
          'absolute inset-0 grid grid-cols-2 sm:grid-cols-4 ' +
          'items-center justify-items-center gap-6 ' +
          'px-6 opacity-[0.07]'

    return (
        <div
            className={containerClasses}
            aria-hidden="true"
            data-testid="rotating-house-watermark"
        >
            {/*
              The image layer is pointer-events-none so it never blocks
              clicks. The hover-sentinel below it (pointer-events-auto)
              owns the pause/resume calls.
            */}
            <div className={silhouetteLayoutClasses}>
                {images.map((src, i) => {
                    const isActive = state.index === i
                    return (
                        <img
                            key={src}
                            src={src}
                            alt=""
                            draggable="false"
                            loading={i === 0 ? 'eager' : 'lazy'}
                            onError={(e) => {
                                if (
                                    import.meta.env.DEV &&
                                    !e.currentTarget.dataset.warned
                                ) {
                                    e.currentTarget.dataset.warned = '1'
                                    // eslint-disable-next-line no-console
                                    console.warn(
                                        '[RotatingHouseWatermark] failed to load:',
                                        src,
                                    )
                                }
                            }}
                            className={
                                tintClasses +
                                ' w-full h-full object-contain ' +
                                'transition-opacity ease-smooth ' +
                                (isHero ? '' : 'max-h-[140px]')
                            }
                            style={{
                                opacity: isActive ? 1 : 0,
                                transitionDuration: `${
                                    fadeMs ?? state.fadeMs
                                }ms`,
                            }}
                        />
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
