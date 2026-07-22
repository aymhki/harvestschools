import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { getCachedAssetUrl } from '../services/General/OfflineImageCacheService.jsx'
import { isNativeRuntime } from '../services/General/OfflineStorageService.jsx'

function useCachedAsset(remoteUrl) {
    const [resolvedUrl, setResolvedUrl] = useState(() => (isNativeRuntime() ? null : remoteUrl))

    const latestRequestRef = useRef(0)

    useEffect(() => {
        if (!isNativeRuntime()) {
            setResolvedUrl(remoteUrl)

            return undefined
        }

        if (!remoteUrl) {
            setResolvedUrl(null)

            return undefined
        }

        const requestId = latestRequestRef.current + 1

        latestRequestRef.current = requestId

        let isActive = true

        getCachedAssetUrl(remoteUrl)
            .then((url) => {
                if (isActive && latestRequestRef.current === requestId) {
                    setResolvedUrl(url)
                }
            })
            .catch(() => {
                if (isActive && latestRequestRef.current === requestId) {
                    setResolvedUrl(remoteUrl)
                }
            })

        return () => {
            isActive = false
        }
    }, [remoteUrl])

    return resolvedUrl
}


function CachedImage({ src, alt, className, fallbackClassName, ...imageProps }) {
    const resolvedUrl = useCachedAsset(src)

    const [hasFailed, setHasFailed] = useState(false)

    useEffect(() => {
        setHasFailed(false)
    }, [src])

    const handleError = (event) => {
        if (!hasFailed && resolvedUrl && resolvedUrl !== src) {
            setHasFailed(true)

            event.currentTarget.src = src

            return
        }

        setHasFailed(true)
    }

    if (!resolvedUrl) {
        return <span className={fallbackClassName || 'cached-image-placeholder'} aria-hidden="true" />
    }

    return (
        <img
            src={resolvedUrl}
            alt={alt}
            className={className}
            onError={handleError}
            {...imageProps}
        />
    )
}


CachedImage.propTypes = {
    src: PropTypes.string,
    alt: PropTypes.string,
    className: PropTypes.string,
    fallbackClassName: PropTypes.string,
}


export default CachedImage

export { useCachedAsset }
