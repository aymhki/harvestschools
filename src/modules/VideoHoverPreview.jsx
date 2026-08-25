import { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useGesture } from '@use-gesture/react'
import { requestVideoPreviewFrames, preloadFramesSequentially } from '../services/Public/Gallery/VideoPreviewServices.jsx'

const FRAME_INTERVAL_MS = 700
const SWIPE_ACTIVATION_PX = 8

function VideoHoverPreview({ path, root, durationSeconds, children, label }) {
    const [frames, setFrames] = useState([])
    const [progress, setProgress] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [frameIndex, setFrameIndex] = useState(0)

    const abortRef = useRef(null)
    const framesRef = useRef([])
    const loadingRef = useRef(false)

    const startPreview = useCallback(() => {
        setIsPreviewing(true)

        if (framesRef.current.length > 0 || loadingRef.current) {
            return
        }

        const controller = new AbortController()

        abortRef.current = controller
        loadingRef.current = true

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

                framesRef.current = loaded
                setFrames(loaded)
            })
            .catch(() => null)
            .finally(() => {
                if (abortRef.current === controller) {
                    abortRef.current = null
                }

                loadingRef.current = false
                setIsLoading(false)
            })
    }, [path, root, durationSeconds])

    const stopPreview = useCallback(() => {
        setIsPreviewing(false)
        setFrameIndex(0)
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
            onDrag: ({ movement: [mx, my], last }) => {
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
    const percent = Math.round(progress * 100)

    return (
        <div
            className={'video-hover-preview'}
            {...bind()}
            onMouseEnter={startPreview}
            onMouseLeave={stopPreview}
        >
            {children}

            {isPreviewing && activeFrame && (
                <img src={activeFrame} alt={''} aria-hidden={'true'} className={'video-hover-preview-frame'}/>
            )}

            {isPreviewing && isLoading && (
                <div
                    className={'video-hover-preview-progress'}
                    role={'progressbar'}
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${label || 'Video'} preview loading progress`}
                >
                    <span className={'video-hover-preview-progress-fill'} style={{ width: `${percent}%` }}/>
                </div>
            )}
        </div>
    )
}

VideoHoverPreview.propTypes = {
    path: PropTypes.string.isRequired,
    root: PropTypes.string,
    durationSeconds: PropTypes.number,
    children: PropTypes.node,
    label: PropTypes.string,
}

export default VideoHoverPreview
