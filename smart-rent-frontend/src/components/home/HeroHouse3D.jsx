import {lazy, Suspense, useCallback, useEffect, useRef, useState} from 'react'
import useHeroHouseMotionPrefs from './useHeroHouseMotionPrefs'

const HeroHouseCanvas = lazy(() => import('./HeroHouseCanvas'))

function HeroHouseFallback({reduceMotion}) {
    return (
        <div
            className="absolute inset-0 flex items-center justify-center
                       bg-[#FBF7F1]"
            aria-hidden>
            <svg
                viewBox="0 0 120 120"
                className="w-[55%] max-w-[200px] text-brand-green/25"
                role="presentation">
                <path
                    fill="currentColor"
                    d="M60 18 L98 48 V92 H22 V48 Z M60 28 L32 52 V86 H88 V52 Z"
                />
                {!reduceMotion && (
                    <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0 0; 0 -2; 0 0"
                        dur="6s"
                        repeatCount="indefinite"
                    />
                )}
            </svg>
        </div>
    )
}

/**
 * Decorative hero house — minimal 3D on capable viewports,
 * static SVG fallback while loading or when WebGL unavailable.
 */
export default function HeroHouse3D() {
    const {reduceMotion, enablePointer, ready} = useHeroHouseMotionPrefs()
    const pointerRef = useRef({x: 0, y: 0})
    const stageRef = useRef(null)
    const [inView, setInView] = useState(true)

    useEffect(() => {
        const el = stageRef.current
        if (!el) return undefined

        const observer = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            {rootMargin: '80px', threshold: 0.05},
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [ready])

    const handlePointerMove = useCallback(
        (event) => {
            if (!enablePointer || !stageRef.current) return
            const rect = stageRef.current.getBoundingClientRect()
            const nx = (event.clientX - rect.left) / rect.width - 0.5
            const ny = (event.clientY - rect.top) / rect.height - 0.5
            pointerRef.current.x = Math.max(-0.5, Math.min(0.5, nx * 2))
            pointerRef.current.y = Math.max(-0.5, Math.min(0.5, ny * 2))
        },
        [enablePointer],
    )

    const handlePointerLeave = useCallback(() => {
        pointerRef.current.x = 0
        pointerRef.current.y = 0
    }, [])

    return (
        <div
            ref={stageRef}
            className="hero-house-stage relative h-[220px] sm:h-[260px]
                       lg:h-[280px] rounded-panel border border-gray-100/80
                       overflow-hidden bg-[#FBF7F1]/60 touch-pan-y"
            aria-hidden
            onPointerMove={enablePointer ? handlePointerMove : undefined}
            onPointerLeave={enablePointer ? handlePointerLeave : undefined}>
            <Suspense
                fallback={
                    <HeroHouseFallback reduceMotion={reduceMotion} />
                }>
                {ready ? (
                    <HeroHouseCanvas
                        pointerRef={pointerRef}
                        reduceMotion={reduceMotion}
                        inView={inView}
                        className="absolute inset-0 !h-full !w-full"
                    />
                ) : (
                    <HeroHouseFallback reduceMotion={reduceMotion} />
                )}
            </Suspense>

            {/* Soft vignette — ties into editorial panel */}
            <div
                className="pointer-events-none absolute inset-0
                           bg-gradient-to-t from-white/30 via-transparent
                           to-transparent"
            />
        </div>
    )
}
