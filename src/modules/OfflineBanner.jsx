import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
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


function OfflineBanner({ onRetry }) {
    const { i18n } = useTranslation()
    const { isOffline, lastChangedAt, refreshNetworkStatus } = useOffline()
    const [isDismissed, setIsDismissed] = useState(false)
    const [isRetrying, setIsRetrying] = useState(false)


    const copy = COPY[String(i18n.language || '').startsWith('ar') ? 'ar' : 'en']

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
            <CloudOffOutlinedIcon className="offline-banner-icon" />

            <p className="offline-banner-message">{copy.message}</p>

            <button
                type="button"
                className="offline-banner-action"
                onClick={handleRetry}
                disabled={isRetrying}
            >
                {isRetrying ? copy.retrying : copy.retry}
            </button>

            <button
                type="button"
                className="offline-banner-close"
                onClick={() => setIsDismissed(true)}
                aria-label={copy.dismiss}
            >
                <CloseOutlinedIcon className="offline-banner-close-icon" />
            </button>
        </div>
    )
}


OfflineBanner.propTypes = {
    onRetry: PropTypes.func,
}


export default OfflineBanner
