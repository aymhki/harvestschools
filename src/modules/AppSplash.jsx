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
                <svg viewBox="0 0 256 256" role="presentation" focusable="false">
                    <path
                        className="app-splash__mark-letter app-splash__mark-letter--h"
                        d="m49.5,181.6h-19.9v-106.5h19.9v42.2h27.8v-42.2h19.9v106.5h-19.9v-48.7h-27.8z"
                    />
                    <path
                        className="app-splash__mark-letter app-splash__mark-letter--i"
                        d="m186,54.2v-26.4h-113.9v26.4h44v148.3h-44v26.3h113.9v-26.3h-42.2v-148.3z"
                    />
                    <path
                        className="app-splash__mark-letter app-splash__mark-letter--s"
                        d="m223.3,105.5h-19.1q0.1,-8.7 -1.6,-12.7 -2.6,-6.2 -10.2,-6.2 -11.1,0 -11.1,9.9 0,5.4 3.3,9.1 2.1,2.3 8.1,6.1 17.9,11.2 24.3,17.5 9,8.8 9,22.3 0,14.7 -8.8,22.7 -8.9,7.9 -24,7.9 -32.3,0 -32.3,-32.3v-7.9h19.9v6.3q0,17.9 12.4,17.9 12.4,0 12.4,-12.5 0,-8.1 -8,-14.1 -8.4,-5.5 -16.7,-11.2 -10,-6.8 -15,-13.5 -5,-6.8 -5,-16.1 0,-28.2 31.3,-28.2 20.6,0 27.4,13.5 3.6,6.8 3.7,21.5z"
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


export default AppSplash;
