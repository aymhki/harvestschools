import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useOffline } from '../services/General/OfflineContext.jsx'
import '../styles/OfflineBanner.css'


const COPY = {
    en: {
        message: 'You are offline. Showing saved content.',
        retry: 'Retry',
        dismiss: 'Dismiss',
        retrying: 'Checking…',
    },
    ar: {
        message: 'أنت غير متصل بالإنترنت. يتم عرض المحتوى المحفوظ.',
        retry: 'إعادة المحاولة',
        dismiss: 'إغلاق',
        retrying: 'جارٍ التحقق…',
    },
}


const detectLanguage = () => {
    try {
        const stored = localStorage.getItem('i18nextLng')

        return stored && stored.startsWith('ar') ? 'ar' : 'en'
    } catch {
        return 'en'
    }
}


function OfflineBanner({ onRetry }) {
    const { isOffline, lastChangedAt, refreshNetworkStatus } = useOffline()
    const [isDismissed, setIsDismissed] = useState(false)
    const [isRetrying, setIsRetrying] = useState(false)
    const copy = useMemo(() => COPY[detectLanguage()] || COPY.en, [])

    useEffect(() => {
        if (isOffline) {
            setIsDismissed(false)
        }
    }, [isOffline, lastChangedAt])

    if (!isOffline || isDismissed) {
        return null
    }

    const handleRetry = async () => {
        setIsRetrying(true)

        try {
            const connected = await refreshNetworkStatus()

            if (connected && onRetry) {
                onRetry()
            }
        } finally {
            setIsRetrying(false)
        }
    }

    return (
        <div className="offline-banner" role="status" aria-live="polite">
            <span className="offline-banner__dot" aria-hidden="true" />

            <p className="offline-banner__message">{copy.message}</p>

            <button
                type="button"
                className="offline-banner__action"
                onClick={handleRetry}
                disabled={isRetrying}
            >
                {isRetrying ? copy.retrying : copy.retry}
            </button>

            <button
                type="button"
                className="offline-banner__close"
                onClick={() => setIsDismissed(true)}
                aria-label={copy.dismiss}
            >
                ×
            </button>
        </div>
    )
}


OfflineBanner.propTypes = {
    onRetry: PropTypes.func,
}


export default OfflineBanner
