import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from 'react-spring'
import PropTypes from 'prop-types'

const SLIDE_DISTANCE = '30%'
const SLIDE_DURATION_MS = 650
const STARTING_OPACITY = 0.35

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const SETTLED_STYLE = { opacity: 1 }

const ANIMATING_STYLE = { willChange: 'transform, opacity' }
const easeOutCubic = (progress) => 1 - Math.pow(1 - progress, 3)


const prefersReducedMotion = () => (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(REDUCED_MOTION_QUERY).matches
)


function PageTransition({ children }) {
    const { i18n } = useTranslation()
    const [isReducedMotion, setIsReducedMotion] = useState(prefersReducedMotion)
    const [isSettled, setIsSettled] = useState(prefersReducedMotion)
    const startOffset = i18n.language === 'ar' ? `-${SLIDE_DISTANCE}` : SLIDE_DISTANCE

    const animatePage = useSpring({
        from: { opacity: STARTING_OPACITY, transform: `translate3d(${startOffset}, 0, 0)` },
        to: { opacity: 1, transform: 'translate3d(0%, 0, 0)' },
        immediate: isReducedMotion,
        config: { duration: SLIDE_DURATION_MS, easing: easeOutCubic },
        onRest: () => setIsSettled(true),
    })

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return undefined
        }

        const query = window.matchMedia(REDUCED_MOTION_QUERY)

        const handleChange = (event) => {
            setIsReducedMotion(event.matches)
            setIsSettled(event.matches)
        }

        query.addEventListener('change', handleChange)

        return () => query.removeEventListener('change', handleChange)
    }, [])

    return (
        <animated.div
            className={'page-transition'}
            style={isSettled ? SETTLED_STYLE : { ...animatePage, ...ANIMATING_STYLE }}
        >
            {children}
        </animated.div>
    )
}


PageTransition.propTypes = {
    children: PropTypes.node,
}


export default PageTransition
