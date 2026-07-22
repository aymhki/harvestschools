import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import '../styles/AppSplash.css'


const MESSAGE_ROTATION_MS = 2600

const MESSAGES = {
    en: [
        'Getting things ready for you…',
        'Putting all the students back in their chairs…',
        'Sharpening every pencil in the building…',
        'Convincing the school bell to behave…',
        'Wiping down the whiteboards…',
        'Alphabetising the library, again…',
        'Chasing the last kid out of the playground…',
        'Warming up the projector…',
        'Filing the permission slips…',
        'Reminding the calendar what day it is…',
        'Straightening the rows of desks…',
        'Finding whoever borrowed the good marker…',
    ],
    ar: [
        'نجهّز كل شيء من أجلك…',
        'نعيد الطلاب إلى مقاعدهم…',
        'نبري كل الأقلام في المدرسة…',
        'نقنع جرس المدرسة بأن يهدأ قليلاً…',
        'ننظّف السبورات…',
        'نرتّب المكتبة من جديد…',
        'نجمع آخر الطلاب من الفناء…',
        'نشغّل جهاز العرض…',
        'نرتّب أوراق الحضور…',
        'نذكّر التقويم بتاريخ اليوم…',
        'نصفّ المقاعد في صفوف مستقيمة…',
        'نبحث عن القلم الذي استعاره أحدهم…',
    ],
}


const shuffle = (items) => {
    const copy = [...items]

    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1))

        const temp = copy[index]

        copy[index] = copy[swapIndex]
        copy[swapIndex] = temp
    }

    return copy
}


const detectLanguage = () => {
    try {
        const params = new URLSearchParams(window.location.search)

        const fromUrl = params.get('lang')

        if (fromUrl === 'ar' || fromUrl === 'en') {
            return fromUrl
        }

        const stored = localStorage.getItem('i18nextLng')

        if (stored && stored.startsWith('ar')) {
            return 'ar'
        }

        if (stored && stored.startsWith('en')) {
            return 'en'
        }

        return (navigator.language || 'en').startsWith('ar') ? 'ar' : 'en'
    } catch {
        return 'en'
    }
}


/**
 * Deliberately dependency free: this renders before i18n, before fonts and
 * before any cached asset is available, so everything it needs is inline.
 */
function AppSplash({ showProgress = false, progress = 0 }) {
    const language = useMemo(detectLanguage, [])

    const messages = useMemo(() => shuffle(MESSAGES[language] || MESSAGES.en), [language])

    const [messageIndex, setMessageIndex] = useState(0)

    const [isMessageVisible, setIsMessageVisible] = useState(true)

    useEffect(() => {
        const interval = setInterval(() => {
            setIsMessageVisible(false)

            setTimeout(() => {
                setMessageIndex((current) => (current + 1) % messages.length)

                setIsMessageVisible(true)
            }, 320)
        }, MESSAGE_ROTATION_MS)

        return () => clearInterval(interval)
    }, [messages.length])

    return (
        <div className="app-splash" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="app-splash__mark" aria-hidden="true">
                <svg viewBox="0 0 120 120" role="presentation" focusable="false">
                    <defs>
                        <linearGradient id="appSplashMarkGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="var(--primary-color)" />
                            <stop offset="100%" stopColor="var(--secondary-color)" />
                        </linearGradient>
                    </defs>

                    <rect x="4" y="4" width="112" height="112" rx="28" fill="url(#appSplashMarkGradient)" />

                    <path
                        d="M38 34 L38 86 M38 60 L82 60 M82 34 L82 86"
                        stroke="var(--fb-white-color)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        fill="none"
                    />
                </svg>

                <span className="app-splash__halo" />
            </div>

            <p className="app-splash__wordmark">Harvest International School</p>

            <p
                className={`app-splash__message ${isMessageVisible ? 'is-visible' : ''}`}
                role="status"
                aria-live="polite"
            >
                {messages[messageIndex]}
            </p>

            {showProgress ? (
                <div className="app-splash__progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="app-splash__progress-fill" style={{ width: `${progress}%` }} />
                </div>
            ) : (
                <div className="app-splash__shimmer" aria-hidden="true">
                    <span />
                </div>
            )}
        </div>
    )
}


AppSplash.propTypes = {
    showProgress: PropTypes.bool,
    progress: PropTypes.number,
}


export default AppSplash
