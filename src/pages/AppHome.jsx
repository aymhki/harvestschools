import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import CachedImage from '../modules/CachedImage.jsx'
import { useOffline } from '../services/General/OfflineContext.jsx'
import { cachedRequest } from '../services/General/OfflineApiCacheService.jsx'
import { fetchApprovedAlumniPosts } from '../services/Public/AlumniStudents/AlumniStudentsPublicServices.jsx'
import { servePublicAsset } from '../services/General/GeneralServices.jsx'
import '../styles/AppHome.css'


const COPY = {
    en: {
        greetingMorning: 'Good morning',
        greetingAfternoon: 'Good afternoon',
        greetingEvening: 'Good evening',
        school: 'Harvest International School',
        quickActions: 'Quick actions',
        upcoming: 'Coming up',
        upcomingEmpty: 'No upcoming dates in the current calendars.',
        alumni: 'From our alumni',
        alumniEmpty: 'Alumni stories will appear here once you have been online.',
        savedCopy: 'Saved copy',
        viewAll: 'View all',
        actions: {
            calendars: 'Calendars',
            booking: 'Graduation booking',
            admission: 'Admission',
            academics: 'Academics',
            gallery: 'Gallery',
            openDay: 'Open day',
            vacancies: 'Vacancies',
            website: 'Full site',
        },
        today: 'Today',
        tomorrow: 'Tomorrow',
        inDays: (days) => `In ${days} days`,
    },
    ar: {
        greetingMorning: 'صباح الخير',
        greetingAfternoon: 'مساء الخير',
        greetingEvening: 'مساء الخير',
        school: 'مدارس هارفست الدولية',
        quickActions: 'إجراءات سريعة',
        upcoming: 'قريبًا',
        upcomingEmpty: 'لا توجد مواعيد قادمة في التقويمات الحالية.',
        alumni: 'من خريجينا',
        alumniEmpty: 'ستظهر قصص الخريجين هنا بعد الاتصال بالإنترنت.',
        savedCopy: 'نسخة محفوظة',
        viewAll: 'عرض الكل',
        actions: {
            calendars: 'التقويمات',
            booking: 'حجز الحفل',
            admission: 'القبول',
            academics: 'الأقسام',
            gallery: 'معرض الصور',
            openDay: 'اليوم المفتوح',
            vacancies: 'الوظائف',
            website: 'الموقع الكامل',
        },
        today: 'اليوم',
        tomorrow: 'غدًا',
        inDays: (days) => `بعد ${days} يومًا`,
    },
}


const CALENDAR_SOURCES = [
    { key: 'events-pages.national-calendar-page.calendar', path: '/events/national-calendar' },
    { key: 'events-pages.british-calendar-page.calendar', path: '/events/british-calendar' },
    { key: 'events-pages.american-calendar-page.calendar', path: '/events/american-calendar' },
    { key: 'events-pages.national-kg-calendar-page.calendar', path: '/events/national-kg-calendar' },
    { key: 'events-pages.british-kg-calendar-page.calendar', path: '/events/british-kg-calendar' },
    { key: 'events-pages.american-kg-calendar-page.calendar', path: '/events/american-kg-calendar' },
]


const QUICK_ACTIONS = [
    { id: 'calendars', path: '/events', tone: 'primary' },
    { id: 'booking', path: '/events/graduation-booking', tone: 'accent' },
    { id: 'admission', path: '/admission', tone: 'plain' },
    { id: 'academics', path: '/academics', tone: 'plain' },
    { id: 'openDay', path: '/events/open-day-signup', tone: 'plain' },
    { id: 'gallery', path: '/gallery', tone: 'plain' },
    { id: 'vacancies', path: '/vacancies', tone: 'plain' },
    { id: 'website', path: '/home', tone: 'plain' },
]


const ACTION_GLYPHS = {
    calendars: 'M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z',
    booking: 'M12 3 3 8l9 5 9-5-9-5zM6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5',
    admission: 'M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M9 13h6M9 17h6',
    academics: 'M4 6h7v13H4zM13 6h7v13h-7zM11 6c0-1.1.9-2 2-2M7 10h1M16 10h1',
    openDay: 'M4 20v-9l8-6 8 6v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z',
    gallery: 'M4 5h16v14H4zM4 15l4.5-4.5 4 4 3-3L20 15M9 9.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z',
    vacancies: 'M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8zM9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M4 13h16',
    website: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
}


const startOfDay = (date) => {
    const copy = new Date(date)

    copy.setHours(0, 0, 0, 0)

    return copy
}


function AppHome() {
    const { t, i18n } = useTranslation(['events-pages'])

    const navigate = useNavigate()

    const { isOffline } = useOffline()

    const language = i18n.language === 'ar' ? 'ar' : 'en'

    const copy = COPY[language]

    const [alumniHighlights, setAlumniHighlights] = useState([])

    const [alumniIsStale, setAlumniIsStale] = useState(false)

    const greeting = useMemo(() => {
        const hour = new Date().getHours()

        if (hour < 12) {
            return copy.greetingMorning
        }

        if (hour < 17) {
            return copy.greetingAfternoon
        }

        return copy.greetingEvening
    }, [copy])

    const dateFormatter = useMemo(
        () => new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: 'Africa/Cairo',
        }),
        [language]
    )

    const upcomingEvents = useMemo(() => {
        const today = startOfDay(new Date())

        const collected = []

        for (const source of CALENDAR_SOURCES) {
            const rows = t(source.key, { returnObjects: true })

            if (!Array.isArray(rows)) {
                continue
            }

            for (const row of rows) {
                if (!row || typeof row !== 'object' || !row['start-date']) {
                    continue
                }

                const startDate = new Date(row['start-date'])

                if (Number.isNaN(startDate.getTime())) {
                    continue
                }

                const endDate = row['end-date'] ? new Date(row['end-date']) : startDate

                const reference = startOfDay(Number.isNaN(endDate.getTime()) ? startDate : endDate)

                if (reference < today) {
                    continue
                }

                collected.push({
                    id: `${source.path}-${row['start-date']}-${row.title}`,
                    title: String(row.title || '').trim(),
                    startDate,
                    path: source.path,
                })
            }
        }

        const seen = new Set()

        return collected
            .filter((entry) => {
                const signature = `${entry.title}|${entry.startDate.toDateString()}`

                if (!entry.title || seen.has(signature)) {
                    return false
                }

                seen.add(signature)

                return true
            })
            .sort((first, second) => first.startDate - second.startDate)
            .slice(0, 4)
    }, [t])

    const describeDistance = (startDate) => {
        const today = startOfDay(new Date())

        const target = startOfDay(startDate)

        const days = Math.round((target - today) / (24 * 60 * 60 * 1000))

        if (days <= 0) {
            return copy.today
        }

        if (days === 1) {
            return copy.tomorrow
        }

        return copy.inDays(days)
    }

    useEffect(() => {
        let isActive = true

        const loadAlumniHighlights = async () => {
            try {
                const result = await cachedRequest(
                    'alumni-posts:app-home:3',
                    () => fetchApprovedAlumniPosts('home', 3)
                )

                if (!isActive) {
                    return
                }

                setAlumniHighlights(Array.isArray(result.data) ? result.data : [])
                setAlumniIsStale(Boolean(result.isStale))
            } catch (loadError) {
                console.warn('Could not load the alumni highlights', loadError)
            }
        }

        loadAlumniHighlights()

        return () => {
            isActive = false
        }
    }, [isOffline])

    return (
        <div className="app-home" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <Helmet>
                <title>Harvest International School</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <header className="app-home__header">
                <div className="app-home__header-text">
                    <p className="app-home__greeting">{greeting}</p>

                    <h1 className="app-home__school">{copy.school}</h1>
                </div>

                <CachedImage
                    src={servePublicAsset('/images/HarvestLogos/HarvestLogoCropped.avif')}
                    alt=""
                    className="app-home__logo"
                    fallbackClassName="app-home__logo app-home__logo--placeholder"
                />
            </header>

            <section className="app-home__section" aria-labelledby="app-home-actions">
                <h2 className="app-home__section-title" id="app-home-actions">{copy.quickActions}</h2>

                <div className="app-home__actions">
                    {QUICK_ACTIONS.map((action) => (
                        <button
                            key={action.id}
                            type="button"
                            className={`app-home__action app-home__action--${action.tone}`}
                            onClick={() => navigate(action.path)}
                        >
                            <span className="app-home__action-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" focusable="false">
                                    <path
                                        d={ACTION_GLYPHS[action.id]}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>

                            <span className="app-home__action-label">{copy.actions[action.id]}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="app-home__section" aria-labelledby="app-home-upcoming">
                <div className="app-home__section-head">
                    <h2 className="app-home__section-title" id="app-home-upcoming">{copy.upcoming}</h2>

                    <button type="button" className="app-home__link" onClick={() => navigate('/events')}>
                        {copy.viewAll}
                    </button>
                </div>

                {upcomingEvents.length === 0 ? (
                    <p className="app-home__empty">{copy.upcomingEmpty}</p>
                ) : (
                    <ul className="app-home__events">
                        {upcomingEvents.map((event) => (
                            <li key={event.id}>
                                <button
                                    type="button"
                                    className="app-home__event"
                                    onClick={() => navigate(event.path)}
                                >
                                    <span className="app-home__event-date">
                                        {dateFormatter.format(event.startDate)}
                                    </span>

                                    <span className="app-home__event-body">
                                        <span className="app-home__event-title">{event.title}</span>

                                        <span className="app-home__event-distance">
                                            {describeDistance(event.startDate)}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="app-home__section" aria-labelledby="app-home-alumni">
                <div className="app-home__section-head">
                    <h2 className="app-home__section-title" id="app-home-alumni">{copy.alumni}</h2>

                    {alumniIsStale && alumniHighlights.length > 0 ? (
                        <span className="app-home__chip">{copy.savedCopy}</span>
                    ) : null}
                </div>

                {alumniHighlights.length === 0 ? (
                    <p className="app-home__empty">{copy.alumniEmpty}</p>
                ) : (
                    <ul className="app-home__alumni">
                        {alumniHighlights.map((post, index) => (
                            <li key={post.id || post.postId || index}>
                                <button
                                    type="button"
                                    className="app-home__alumni-card"
                                    onClick={() => navigate('/students-life/alumni-students')}
                                >
                                    <span className="app-home__alumni-name">
                                        {post.name || post.fullName || post.author || ''}
                                    </span>

                                    <span className="app-home__alumni-excerpt">
                                        {String(post.content || post.body || post.message || '')
                                            .replace(/[#*_>`[\]()]/g, '')
                                            .slice(0, 140)}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    )
}


export default AppHome
