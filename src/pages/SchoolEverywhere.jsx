import { useCallback, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import Spinner from '../modules/Spinner.jsx'
import { useOffline } from '../services/General/OfflineContext.jsx'
import {
    attachExternalSiteListeners,
    closeExternalSite,
    markExternalSiteClosed,
    openSchoolEverywhere,
    readTarget,
} from '../services/General/ExternalSiteService.jsx'
import '../styles/SchoolEverywhere.css'


const HOME_PATH = '/app-home'

const COPY = {
    en: {
        title: 'SchoolEverywhere',
        opening: 'Opening SchoolEverywhere…',
        offlineTitle: 'You are offline',
        offlineBody: 'SchoolEverywhere needs a connection. Reconnect and try again.',
        failedTitle: 'SchoolEverywhere did not open',
        failedBody: 'Something stopped the page from loading. You can try again.',
        retry: 'Try again',
        home: 'Back to home',
    },
    ar: {
        title: 'SchoolEverywhere',
        opening: '…جاري فتح SchoolEverywhere',
        offlineTitle: 'أنت غير متصل بالإنترنت',
        offlineBody: 'يحتاج SchoolEverywhere إلى اتصال بالإنترنت. أعد الاتصال وحاول مرة أخرى.',
        failedTitle: 'تعذر فتح SchoolEverywhere',
        failedBody: 'حدث ما منع تحميل الصفحة. يمكنك المحاولة مرة أخرى.',
        retry: 'إعادة المحاولة',
        home: 'العودة للرئيسية',
    },
}


function SchoolEverywhere() {
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const { i18n } = useTranslation()
    const { isOffline } = useOffline()

    const language = i18n.language === 'ar' ? 'ar' : 'en'
    const copy = COPY[language]
    const target = readTarget(searchParams.get('target'))

    const [hasFailed, setHasFailed] = useState(false)
    const hasOpenedRef = useRef(false)
    const isLeavingRef = useRef(false)

    const leaveToPreviousScreen = useCallback(() => {
        if (isLeavingRef.current) {
            return
        }

        isLeavingRef.current = true

        if (location.key === 'default') {
            navigate(HOME_PATH, { replace: true })
        } else {
            navigate(-1)
        }
    }, [location.key, navigate])

    const leaveToHome = useCallback(() => {
        if (isLeavingRef.current) {
            return
        }

        isLeavingRef.current = true

        navigate(HOME_PATH, { replace: true })
    }, [navigate])

    const openSite = useCallback(async () => {
        setHasFailed(false)

        try {
            await openSchoolEverywhere({ target, title: COPY[language].title })
        } catch (openError) {
            hasOpenedRef.current = false

            setHasFailed(true)
        }
    }, [language, target])

    useEffect(() => {
        return attachExternalSiteListeners({
            onClose: () => {
                markExternalSiteClosed()

                leaveToPreviousScreen()
            },
            onHome: () => {
                markExternalSiteClosed()

                closeExternalSite().finally(leaveToHome)
            },
        })
    }, [leaveToHome, leaveToPreviousScreen])

    useEffect(() => {
        if (isOffline || hasOpenedRef.current) {
            return
        }

        hasOpenedRef.current = true

        openSite()
    }, [isOffline, openSite])

    useEffect(() => {
        return () => {
            markExternalSiteClosed()

            closeExternalSite()
        }
    }, [])

    const handleRetry = () => {
        hasOpenedRef.current = true

        openSite()
    }

    let body = (
        <div className="school-everywhere-state">
            <Spinner />

            <p className="school-everywhere-message">{copy.opening}</p>
        </div>
    )

    if (isOffline || hasFailed) {
        body = (
            <div className="school-everywhere-state">
                <OpenInNewOutlinedIcon className="school-everywhere-icon" />

                <h1 className="school-everywhere-title">
                    {isOffline ? copy.offlineTitle : copy.failedTitle}
                </h1>

                <p className="school-everywhere-message">
                    {isOffline ? copy.offlineBody : copy.failedBody}
                </p>

                <div className="school-everywhere-actions">
                    {!isOffline && (
                        <button type="button" className="school-everywhere-button" onClick={handleRetry}>
                            {copy.retry}
                        </button>
                    )}

                    <button
                        type="button"
                        className="school-everywhere-button is-quiet"
                        onClick={leaveToHome}
                    >
                        {copy.home}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="school-everywhere" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <Helmet>
                <title>SchoolEverywhere · Harvest International School</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            {body}
        </div>
    )
}


export default SchoolEverywhere
