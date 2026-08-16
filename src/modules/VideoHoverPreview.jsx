import { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useGesture } from '@use-gesture/react'
import { requestVideoPreviewFrames, preloadFramesSequentially } from '../services/Public/Gallery/VideoPreviewServices.jsx'

const FRAME_INTERVAL_MS = 700
const SWIPE_ACTIVATION_PX = 8

function VideoHoverPreview({ path, root, durationSeconds, children, onActivate }) {
    const [frames, setFrames] = useState([])
    const [progress, setProgress] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [frameIndex, setFrameIndex] = useState(0)

    const abortRef = useRef(null)
    const hasFailedRef = useRef(false)

    const startPreview = useCallback(() => {
        if (hasFailedRef.current || isPreviewing) {
            return
        }

        setIsPreviewing(true)

        if (frames.length > 0 || isLoading) {
            return
        }

        const controller = new AbortController()
        abortRef.current = controller

        setIsLoading(true)
        setProgress(0)

        requestVideoPreviewFrames({ path, root, durationSeconds, signal: controller.signal })
            .then((data) => preloadFramesSequentially(
                data.frames.map((frame) => frame.url),
                { onProgress: setProgress, signal: controller.signal }
            ))
            .then((loaded) => {
                if (controller.signal.aborted) {
                    return
                }

                if (loaded.length === 0) {
                    hasFailedRef.current = true
                }

                setFrames(loaded)
                setIsLoading(false)
            })
            .catch(() => {
                hasFailedRef.current = true
                setIsLoading(false)
            })
    }, [path, root, durationSeconds, frames.length, isLoading, isPreviewing])

    const stopPreview = useCallback(() => {
        setIsPreviewing(false)
        setFrameIndex(0)

        if (abortRef.current) {
            abortRef.current.abort()
            abortRef.current = null
        }

        setIsLoading(false)
        setProgress(0)
    }, [])

    useEffect(() => {
        if (!isPreviewing || frames.length === 0) {
            return undefined
        }

        const timer = setInterval(() => {
            setFrameIndex((current) => (current + 1) % frames.length)
        }, FRAME_INTERVAL_MS)

        return () => clearInterval(timer)
    }, [isPreviewing, frames.length])

    useEffect(() => {
        return () => {
            if (abortRef.current) {
                abortRef.current.abort()
            }
        }
    }, [])

    const bind = useGesture(
        {
            onHover: ({ hovering }) => {
                if (!window.matchMedia('(hover: hover)').matches) {
                    return
                }

                if (hovering) {
                    startPreview()
                } else {
                    stopPreview()
                }
            },
            onDrag: ({ movement: [mx, my], last, tap }) => {
                if (tap) {
                    return
                }

                if (last) {
                    stopPreview()
                    return
                }

                if (Math.abs(mx) > SWIPE_ACTIVATION_PX && Math.abs(mx) > Math.abs(my)) {
                    startPreview()
                }
            },
        },
        {
            drag: { axis: 'x', filterTaps: true, pointer: { touch: true } },
        }
    )

    const activeFrame = frames.length > 0 ? frames[frameIndex] : null

    return (
        <div className={'video-hover-preview'} {...bind()} onClick={onActivate}>
            {children}

            {isPreviewing && activeFrame && (
                <img src={activeFrame} alt={''} aria-hidden={'true'} className={'video-hover-preview-frame'}/>
            )}

            {isPreviewing && isLoading && (
                <span className={'video-hover-preview-progress'} aria-hidden={'true'}>
                    <svg viewBox={'0 0 36 36'} focusable={'false'}>
                        <circle className={'video-hover-preview-progress-track'} cx={'18'} cy={'18'} r={'16'}/>
                        <circle
                            className={'video-hover-preview-progress-line'}
                            cx={'18'}
                            cy={'18'}
                            r={'16'}
                            pathLength={'100'}
                            style={{ strokeDashoffset: 100 - Math.round(progress * 100) }}
                        />
                    </svg>
                </span>
            )}
        </div>
    )
}

VideoHoverPreview.propTypes = {
    path: PropTypes.string.isRequired,
    root: PropTypes.string,
    durationSeconds: PropTypes.number,
    children: PropTypes.node,
    onActivate: PropTypes.func,
}

export default VideoHoverPreview
