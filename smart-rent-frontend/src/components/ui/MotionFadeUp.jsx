import { motion } from 'framer-motion'

// ─────────────────────────────────────────────────────
// MOTION FADE UP
//
// Lightweight wrapper around framer-motion's motion.div.
// Defaults to a 220 ms opacity + translateY entrance.
// All framer-motion elements honour <MotionConfig
// reducedMotion="user"> globally, so individual
// useReducedMotion checks aren't needed here.
// ─────────────────────────────────────────────────────

const DEFAULTS = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.22, ease: [0.0, 0, 0.2, 1] },
}

export default function MotionFadeUp({
                                          children,
                                          delay = 0,
                                          y = 8,
                                          duration = 0.22,
                                          className = '',
                                          as = 'div',
                                          ...rest
                                      }) {
    const MotionTag = motion[as] || motion.div

    const config = {
        ...DEFAULTS,
        initial: { opacity: 0, y },
        animate: { opacity: 1, y: 0 },
        transition: {
            duration,
            delay,
            ease: [0.0, 0, 0.2, 1],
        },
    }

    return (
        <MotionTag className={className} {...config} {...rest}>
            {children}
        </MotionTag>
    )
}
