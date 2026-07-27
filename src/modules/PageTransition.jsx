import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from 'react-spring'
import PropTypes from 'prop-types'


const SLIDE_DISTANCE = '10%'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const SETTLED_STYLE = { opacity: 1 }


const prefersReducedMotion = () => (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(REDUCED_MOTION_QUERY).matches
)


function PageTransition({ children }) {
    const location = useLocation()

    const { i18n } = useTranslation()

    const [isReducedMotion, setIsReducedMotion] = useState(prefersReducedMotion)

    const [isSettled, setIsSettled] = useState(true)

    const startOffset = i18n.language === 'ar' ? `-${SLIDE_DISTANCE}` : SLIDE_DISTANCE

    const animatePage = useSpring({
        from: { opacity: 0.5, transform: `translate3d(${startOffset}, 0, 0)` },
        to: { opacity: 1, transform: 'translate3d(0%, 0, 0)' },
        reset: true,
        immediate: isReducedMotion,
        config: { tension: 210, friction: 28 },
        onRest: () => setIsSettled(true),
    })

    useEffect(() => {
        setIsSettled(false)
    }, [location.pathname])

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return undefined
        }

        const query = window.matchMedia(REDUCED_MOTION_QUERY)

        const handleChange = (event) => setIsReducedMotion(event.matches)

        query.addEventListener('change', handleChange)

        return () => query.removeEventListener('change', handleChange)
    }, [])

    return (
        <animated.div
            key={location.pathname}
            className={'page-transition'}
            style={isSettled ? SETTLED_STYLE : animatePage}
        >
            {children}
        </animated.div>
    )
}


PageTransition.propTypes = {
    children: PropTypes.node,
}


export default PageTransition
