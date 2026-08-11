import { motion } from 'framer-motion'
import { Children, cloneElement, isValidElement } from 'react'

// ─────────────────────────────────────────────────────
// STAGGER + STAGGER ITEM
//
// Orchestrated grid entrance — drops in alongside the
// existing CSS animations without needing per-item
// animation-delay CSS. Use <Stagger> as the parent of
// <StaggerItem> children; the parent cascades the
// delay down so the children appear in sequence.
//
//   <Stagger itemDelay={0.04} maxItems={9}>
//     {items.map(item => (
//       <StaggerItem key={item.id}>
//         <Card {...item} />
//       </StaggerItem>
//     ))}
//   </Stagger>
// ─────────────────────────────────────────────────────

export function Stagger({
                            children,
                            itemDelay = 0.04,
                            initialDelay = 0,
                            maxItems = 12,
                            className = '',
                        }) {
    // We don't actually need a parent-level <motion.div>
    // here because each child is its own motion element.
    // But wrapping lets us add a className for layout.
    return (
        <div className={className}>
            {Children.map(children, (child, index) => {
                if (!isValidElement(child)) return child
                const delay = initialDelay +
                    Math.min(index, maxItems) * itemDelay
                return cloneElement(child, { delay })
            })}
        </div>
    )
}

export function StaggerItem({
                                children,
                                delay = 0,
                                y = 8,
                                duration = 0.32,
                                className = '',
                                as = 'div',
                                ...rest
                            }) {
    const MotionTag = motion[as] || motion.div

    return (
        <MotionTag
            className={className}
            initial={{ opacity: 0, y }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration,
                delay,
                ease: [0.0, 0, 0.2, 1],
            }}
            {...rest}
        >
            {children}
        </MotionTag>
    )
}
