/**
 * WatermarkController
 * -------------------
 * Module-level pub/sub store that keeps one or more <RotatingHouseWatermark>
 * instances perfectly in sync. Pure JS — no React imports.
 *
 * Lifecycle:
 *   - The interval is started when the first subscriber attaches and stopped
 *     when the last one detaches. No work runs while nothing is mounted.
 *   - `pause()` / `resume()` use a refcount, so hovering EITHER instance
 *     freezes BOTH carousels on the same frame.
 *
 * prefers-reduced-motion:
 *   - Detected once at module load. When set, the controller uses a longer
 *     10s interval and an instant crossfade (0ms) so motion-sensitive users
 *     get a calm view.
 *
 * Image count:
 *   - The first subscriber calls `setImageCount(n)` to declare how many
 *     images are in the rotation. All subsequent subscribers are assumed
 *     to use the same count. If you ever need mixed counts, fork this
 *     controller into per-instance ones.
 */

const DEFAULT_INTERVAL_MS = 5000
const DEFAULT_FADE_MS = 1200
const REDUCED_INTERVAL_MS = 10000
const REDUCED_FADE_MS = 0

const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

const initialState = () => ({
    index: 0,                    // current slot (0..imageCount-1)
    imageCount: 0,               // set by first subscriber
    intervalMs: prefersReducedMotion
        ? REDUCED_INTERVAL_MS
        : DEFAULT_INTERVAL_MS,
    fadeMs: prefersReducedMotion ? REDUCED_FADE_MS : DEFAULT_FADE_MS,
    isPaused: false,
    isReducedMotion: prefersReducedMotion,
})

let state = initialState()
const listeners = new Set()
let intervalHandle = null
let pauseRefCount = 0

function setState(patch) {
    state = {...state, ...patch}
    listeners.forEach((listener) => listener())
}

function startInterval() {
    if (intervalHandle !== null) return
    intervalHandle = setInterval(() => {
        if (pauseRefCount > 0 || state.imageCount <= 0) return
        setState({index: (state.index + 1) % state.imageCount})
    }, state.intervalMs)
}

function stopInterval() {
    if (intervalHandle === null) return
    clearInterval(intervalHandle)
    intervalHandle = null
}

/* ── Public API ──────────────────────────────────────────── */

export function subscribe(listener) {
    listeners.add(listener)
    startInterval()
    return () => {
        listeners.delete(listener)
        if (listeners.size === 0) stopInterval()
    }
}

export function getSnapshot() {
    return state
}

/** First subscriber declares the image count. Idempotent. */
export function setImageCount(n) {
    if (n === state.imageCount) return
    // Clamp current index if the count shrank.
    const nextIndex = state.imageCount > 0
        ? state.index % Math.max(1, n)
        : 0
    setState({imageCount: n, index: nextIndex})
}

/** Refcounted pause — first caller freezes, last resumER unfreezes. */
export function pause() {
    pauseRefCount += 1
    if (pauseRefCount === 1 && !state.isPaused) {
        setState({isPaused: true})
    }
}

export function resume() {
    if (pauseRefCount === 0) return
    pauseRefCount -= 1
    if (pauseRefCount === 0 && state.isPaused) {
        setState({isPaused: false})
    }
}

/** Test-only reset. */
export function __resetForTests() {
    stopInterval()
    pauseRefCount = 0
    state = initialState()
    listeners.clear()
}
