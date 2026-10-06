import {useEffect, useState} from 'react'

/**
 * Hero 3D motion prefs: reduced motion, coarse pointer, and whether
 * cursor-driven parallax is allowed (desktop + fine pointer only).
 */
export default function useHeroHouseMotionPrefs() {
    const [prefs, setPrefs] = useState(() => ({
        reduceMotion: false,
        coarsePointer: false,
        enablePointer: false,
        ready: false,
    }))

    useEffect(() => {
        const mqMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        )
        const mqPointer = window.matchMedia('(pointer: coarse)')

        const sync = () => {
            const reduceMotion = mqMotion.matches
            const coarsePointer = mqPointer.matches
            const enablePointer =
                !reduceMotion &&
                !coarsePointer &&
                window.matchMedia('(min-width: 1024px)').matches

            setPrefs({
                reduceMotion,
                coarsePointer,
                enablePointer,
                ready: true,
            })
        }

        sync()
        mqMotion.addEventListener('change', sync)
        mqPointer.addEventListener('change', sync)
        window.addEventListener('resize', sync)

        return () => {
            mqMotion.removeEventListener('change', sync)
            mqPointer.removeEventListener('change', sync)
            window.removeEventListener('resize', sync)
        }
    }, [])

    return prefs
}
