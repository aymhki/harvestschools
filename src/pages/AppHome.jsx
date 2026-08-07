import { useCallback, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { App as CapacitorApp } from '@capacitor/app'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import CastForEducationOutlinedIcon from '@mui/icons-material/CastForEducationOutlined'
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined'
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'
import TranslateIcon from '@mui/icons-material/Translate'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import CallOutlinedIcon from '@mui/icons-material/CallOutlined'
import AlumniPostCard from '../modules/AlumniPostCard.jsx'
import WidgetActionsControls from '../modules/WidgetActionsControls.jsx'
import WeatherIcon, { describeWeatherCondition } from '../modules/WeatherIcon.jsx'
import CachedImage from '../modules/CachedImage.jsx'
import { useOffline } from '../services/General/OfflineContext.jsx'
import { cachedRequest } from '../services/General/OfflineApiCacheService.jsx'
import { fetchApprovedAlumniPosts } from '../services/Public/AlumniStudents/AlumniStudentsPublicServices.jsx'
import { getUpcomingEventsAcrossCalendars, loadAllCalendars, startOfToday } from '../services/General/SchoolCalendarsService.jsx'
import { getSubscribedCalendarIds } from '../services/General/CalendarSubscriptionService.jsx'
import { getPrefetchStatus, runOfflinePrefetch } from '../services/General/OfflinePrefetchService.jsx'
import { OFFLINE_CONTENT_SAVED_EVENT } from '../modules/AppUpdateGate.jsx'
import { getCurrentBundleVersion } from '../services/General/AppUpdaterService.jsx'
import { servePublicAsset } from '../services/General/GeneralServices.jsx'
import { alumniStudentsPageUrl, useToggleLanguage } from '../services/General/GeneralUtils.jsx'
import { openInOwningApp } from '../services/General/ExternalSiteService.jsx'
import { getCurrentWeather } from '../services/General/WeatherService.jsx'
import { isWidgetSupported } from '../services/General/HomeWidgetService.jsx'
import '../styles/AppHome.css'


const MAX_UPCOMING_EVENTS = 4
const MAX_ALUMNI_HIGHLIGHTS = 3
const MORNING_ENDS_AT_HOUR = 12
const AFTERNOON_ENDS_AT_HOUR = 17
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000


const isLatinText = (text) => /[A-Za-z]/.test(text)

const COPY = {
    en: {
        greetingMorning: 'Good morning',
        greetingAfternoon: 'Good afternoon',
        greetingEvening: 'Good evening',
        school: 'Harvest International Schools',
        quickActions: 'Quick actions',
        upcoming: 'Coming up',
        upcomingEmpty: 'No upcoming dates in the current calendars.',
        alumni: 'From our alumni',
        alumniEmpty: 'Alumni stories will appear here once you have been online.',
        connect: 'Reach us',
        device: 'On this device',
        savedCopy: 'Saved copy',
        offlineHint: 'Offline',
        viewAll: 'View all',
        allDepartments: 'All departments',
        remindersTitle: 'Event reminders',
        remindersNone: 'No calendar followed yet',
        remindersOne: '1 calendar followed',
        remindersMany: (count) => `${count} calendars followed`,
        remindersAction: 'Manage',
        offlineTitle: 'Offline content',
        offlineNever: 'Not saved yet',
        offlineSavedOn: (date) => `Saved on ${date}`,
        offlineAction: 'Update',
        offlineWorking: 'Saving…',
        versionLabel: 'App content version',
        appVersionLabel: 'App version',
        widgetTitle: 'Quick actions widget',
        widgetHint: 'Pick the actions to show on the home screen and lock screen widgets.',
        widgetSizes: (small, medium, large) => `A small widget shows the first ${small}, a medium one ${medium} and a large one up to ${large}.`,
        widgetCounter: (chosen, total) => `${chosen} of ${total} chosen`,
        widgetAction: 'Choose',
        widgetChosen: (count) => `${count} actions shown`,
        widgetOne: '1 action shown',
        save: 'Save',
        cancel: 'Cancel',
        actions: {
            calendars: 'Calendars',
            booking: 'Graduation booking',
            admission: 'Admission',
            schooleverywhere: 'SchoolEverywhere',
            academics: 'Academics',
            studentsLife: 'Students life',
            gallery: 'Gallery',
            moreInfo: 'More info',
            vacancies: 'Careers',
            admin: 'Staff portal',
            website: 'Full site',
        },
        links: {
            whatsapp: 'Chat with us',
            facebook: 'Facebook',
            directions: 'Directions',
            call: 'Call us',
        },
        switchLanguage: 'العربية',
        weatherLoading: 'Checking the weather…',
        today: 'Today',
        tomorrow: 'Tomorrow',
        inDays: (days) => `In ${days} days`,
    },
    ar: {
        greetingMorning: 'صباح الخير',
        greetingAfternoon: 'مساء الخير',
        greetingEvening: 'مساء الخير',
        school: 'مدارس هارڤست الدولية',
        quickActions: 'إجراءات سريعة',
        upcoming: 'قريبًا',
        upcomingEmpty: 'لا توجد مواعيد قادمة في التقويمات الحالية.',
        alumni: 'من خريجينا',
        alumniEmpty: 'ستظهر قصص الخريجين هنا بعد الاتصال بالإنترنت.',
        connect: 'تواصل معنا',
        device: 'على هذا الجهاز',
        savedCopy: 'نسخة محفوظة',
        offlineHint: 'بدون اتصال',
        viewAll: 'عرض الكل',
        allDepartments: 'كل الأقسام',
        remindersTitle: 'تنبيهات المواعيد',
        remindersNone: 'لم يتم متابعة أي تقويم',
        remindersOne: 'تتم متابعة تقويم واحد',
        remindersMany: (count) => `تتم متابعة ${count} تقويمات`,
        remindersAction: 'إدارة',
        offlineTitle: 'المحتوى بدون إنترنت',
        offlineNever: 'لم يتم الحفظ بعد',
        offlineSavedOn: (date) => `تم الحفظ في ${date}`,
        offlineAction: 'تحديث',
        offlineWorking: 'جاري الحفظ…',
        versionLabel: 'إصدار محتوى التطبيق',
        appVersionLabel: 'إصدار التطبيق',
        widgetTitle: 'أداة الإجراءات السريعة',
        widgetHint: 'اختر الإجراءات التي تظهر في أدوات الشاشة الرئيسية وشاشة القفل.',
        widgetSizes: (small, medium, large) => `الأداة الصغيرة تعرض أول ${small} إجراءات، والمتوسطة ${medium}، والكبيرة حتى ${large}.`,
        widgetCounter: (chosen, total) => `تم اختيار ${chosen} من ${total}`,
        widgetAction: 'اختيار',
        widgetChosen: (count) => `يتم عرض ${count} إجراءات`,
        widgetOne: 'يتم عرض إجراء واحد',
        save: 'حفظ',
        cancel: 'إلغاء',
        actions: {
            calendars: 'التقويمات',
            booking: 'حجز الحفل',
            admission: 'التسجيل',
            schooleverywhere: 'SchoolEverywhere',
            academics: 'الأقسام',
            studentsLife: 'حياة الطلاب',
            gallery: 'معرض الصور',
            moreInfo: 'معلومات أكثر',
            vacancies: 'الوظائف',
            admin: 'بوابة العاملين',
            website: 'الموقع الكامل',
        },
        links: {
            whatsapp: 'تحدث معنا',
            facebook: 'فيسبوك',
            directions: 'العنوان',
            call: 'اتصل بنا',
        },
        switchLanguage: 'English',
        weatherLoading: 'جاري قراءة حالة الطقس…',
        today: 'اليوم',
        tomorrow: 'غدًا',
        inDays: (days) => `بعد ${days} يومًا`,
    },
}


const WIDGET_EXCLUDED_ACTION_IDS = ['website', 'moreInfo', 'vacancies', 'admission', 'academics']

const QUICK_ACTIONS = [
    { id: 'calendars', path: '/events', Icon: CalendarMonthOutlinedIcon },
    { id: 'booking', path: '/events/graduation-booking', Icon: HowToRegOutlinedIcon },
    { id: 'admission', path: '/admission', Icon: SchoolOutlinedIcon },
    { id: 'schooleverywhere', path: '/schooleverywhere', Icon: CastForEducationOutlinedIcon },
    { id: 'academics', path: '/academics', Icon: MenuBookOutlinedIcon },
    { id: 'studentsLife', path: '/students-life', Icon: GroupsOutlinedIcon },
    { id: 'gallery', path: '/gallery', Icon: PhotoLibraryOutlinedIcon },
    { id: 'moreInfo', path: '/more-info', Icon: HelpOutlineOutlinedIcon },
    { id: 'vacancies', path: '/careers', Icon: WorkOutlineIcon },
    { id: 'admin', path: '/admin-login', Icon: AdminPanelSettingsOutlinedIcon },
    { id: 'website', path: '/home', Icon: LanguageOutlinedIcon },
]


const CONNECT_LINKS = [
    { id: 'whatsapp', url: 'https://wa.me/201118900165', Icon: WhatsAppIcon, needsNetwork: true },
    { id: 'facebook', url: 'https://www.facebook.com/HarvestInternationalSchools/', Icon: FacebookOutlinedIcon, needsNetwork: true },
    { id: 'directions', url: 'https://maps.app.goo.gl/8nqczZg9sFAdCesw7', Icon: PlaceOutlinedIcon, needsNetwork: true },
    { id: 'call', url: 'tel:+201118900165', Icon: CallOutlinedIcon, needsNetwork: false },
]


const openConnectLink = (url) => {
    openInOwningApp(url)
}


function AppHome() {
    const { i18n } = useTranslation(['events-pages'])
    const navigate = useNavigate()
    const { isOffline } = useOffline()
    const toggleLanguage = useToggleLanguage({ ignoreDocUpdate: true })
    const language = i18n.language === 'ar' ? 'ar' : 'en'
    const copy = COPY[language]
    const [alumniHighlights, setAlumniHighlights] = useState([])
    const [alumniIsStale, setAlumniIsStale] = useState(false)
    const [subscribedCalendarCount, setSubscribedCalendarCount] = useState(0)
    const [offlineSavedAt, setOfflineSavedAt] = useState(null)
    const [bundleVersion, setBundleVersion] = useState(null)

    const [weather, setWeather] = useState(null)
    const [isWeatherLoading, setIsWeatherLoading] = useState(false)
    const [widgetActionCount, setWidgetActionCount] = useState(0)
    const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false)
    const [appVersion, setAppVersion] = useState(null)
    const [isSavingOfflineContent, setIsSavingOfflineContent] = useState(false)

    const greeting = useMemo(() => {
        const hour = new Date().getHours()

        let label = copy.greetingEvening

        if (hour < MORNING_ENDS_AT_HOUR) {
            label = copy.greetingMorning
        } else if (hour < AFTERNOON_ENDS_AT_HOUR) {
            label = copy.greetingAfternoon
        }

        return label
    }, [copy])

    const weatherCity = weather ? (language === 'ar' ? weather.cityArabic || weather.city : weather.city) : ''

    const locale = language === 'ar' ? 'ar-EG' : 'en-US'

    const shortDateFormatter = useMemo(
        () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }),
        [locale]
    )

    const numberFormatter = useMemo(
        () => new Intl.NumberFormat(locale),
        [locale]
    )

    const temperatureFormatter = useMemo(
        () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
        [locale]
    )

    const longDateFormatter = useMemo(
        () => new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }),
        [locale]
    )

    const widgetCatalogue = useMemo(
        () => QUICK_ACTIONS
            .filter((action) => !WIDGET_EXCLUDED_ACTION_IDS.includes(action.id))
            .map((action) => ({
                id: action.id,
                path: action.path,
                label: copy.actions[action.id],
                Icon: action.Icon,
            })),
        [copy]
    )

    const [loadedCalendars, setLoadedCalendars] = useState([])

    useEffect(() => {
        let isActive = true

        loadAllCalendars(i18n.language === 'ar' ? 'ar' : 'en')
            .then((calendars) => {
                if (isActive) {
                    setLoadedCalendars(calendars)
                }
            })
            .catch(() => null)

        return () => {
            isActive = false
        }
    }, [i18n.language])

    const upcomingEvents = useMemo(
        () => getUpcomingEventsAcrossCalendars(loadedCalendars, MAX_UPCOMING_EVENTS),
        [loadedCalendars]
    )

    const describeDistance = useCallback((startDate) => {
        const days = Math.round((startDate - startOfToday()) / MILLISECONDS_PER_DAY)

        let label = copy.inDays(days)

        if (days <= 0) {
            label = copy.today
        } else if (days === 1) {
            label = copy.tomorrow
        }

        return label
    }, [copy])

    const describeDepartments = useCallback((event) => {
        return event.isSharedByAllCalendars
            ? copy.allDepartments
            : event.calendarLabels.map((label) => label[language]).join(' · ')
    }, [copy, language])

    const describeReminders = () => {
        let label = copy.remindersMany(subscribedCalendarCount)

        if (subscribedCalendarCount === 0) {
            label = copy.remindersNone
        } else if (subscribedCalendarCount === 1) {
            label = copy.remindersOne
        }

        return label
    }

    const loadDeviceState = useCallback(async () => {
        const [calendarIds, prefetchStatus, currentBundleVersion] = await Promise.all([
            getSubscribedCalendarIds(),
            getPrefetchStatus(),
            getCurrentBundleVersion(),
        ])

        setSubscribedCalendarCount(calendarIds.length)
        setOfflineSavedAt(prefetchStatus.completedAt)
        setBundleVersion(currentBundleVersion)

        try {
            const info = await CapacitorApp.getInfo()

            setAppVersion({ version: info.version, build: info.build })
        } catch (infoError) {
            console.warn('Could not read the app version', infoError)
        }
    }, [])

    const goTo = (path) => {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => null)

        navigate(path)
    }

    const handleSaveOfflineContent = async () => {
        setIsSavingOfflineContent(true)

        await runOfflinePrefetch({ force: true })

        await loadDeviceState()

        setIsSavingOfflineContent(false)
    }

    useEffect(() => {
        const handleOfflineContentSaved = () => loadDeviceState()

        window.addEventListener(OFFLINE_CONTENT_SAVED_EVENT, handleOfflineContentSaved)

        return () => window.removeEventListener(OFFLINE_CONTENT_SAVED_EVENT, handleOfflineContentSaved)
    }, [loadDeviceState])

    useEffect(() => {
        let isActive = true

        const loadAlumniHighlights = async () => {
            try {
                const result = await cachedRequest(
                    `alumni-posts:app-home:${MAX_ALUMNI_HIGHLIGHTS}`,
                    () => fetchApprovedAlumniPosts('home', MAX_ALUMNI_HIGHLIGHTS)
                )

                if (isActive) {
                    setAlumniHighlights(Array.isArray(result.data) ? result.data : [])
                    setAlumniIsStale(Boolean(result.isStale))
                }
            } catch (loadError) {
                console.warn('Could not load the alumni highlights', loadError)
            }
        }

        const loadWeather = async () => {
            if (isOffline) {
                setWeather(null)

                return
            }

            setIsWeatherLoading(true)

            const reading = await getCurrentWeather({})

            if (isActive) {
                setWeather(reading)
                setIsWeatherLoading(false)
            }
        }

        loadAlumniHighlights()
        loadDeviceState()
        loadWeather()

        return () => {
            isActive = false
        }
    }, [isOffline, language, loadDeviceState])

    return (
        <div className="app-home" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <Helmet>
                <title>Harvest International School</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <header className="app-home-header">
                <CachedImage
                    src={servePublicAsset('/images/HarvestLogos/HarvestLogoCropped.avif')}
                    alt=""
                    className="app-home-logo"
                    fallbackClassName="app-home-logo"
                />

                <div className="app-home-header-text">
                    <h2 className="app-home-school">{copy.school}</h2>

                    <p className="app-home-greeting">
                        {greeting}

                        {(weather || isWeatherLoading) && !isOffline && (
                            <span
                                className="app-home-greeting-separator"
                                aria-hidden="true"
                            />
                        )}

                        {weather && (
                            <span
                                className="app-home-weather"
                                title={describeWeatherCondition(weather.condition, language)}
                            >
                                <WeatherIcon
                                    condition={weather.condition}
                                    isDay={weather.isDay}
                                    className="app-home-weather-icon"
                                />

                                <span className="app-home-weather-value">
                                    {`${temperatureFormatter.format(weather.temperature)}°`}
                                </span>

                                {weatherCity && (
                                    <span className={`app-home-weather-city ${isLatinText(weatherCity) ? 'in-latin' : ''}`}>
                                        {weatherCity}
                                    </span>
                                )}
                            </span>
                        )}

                        {!weather && isWeatherLoading && !isOffline && (
                            <span className="app-home-weather-city">{copy.weatherLoading}</span>
                        )}
                    </p>

                    <p className="app-home-today">
                        {longDateFormatter.format(new Date())}

                        {isOffline && <span className="app-home-chip">{copy.offlineHint}</span>}
                    </p>

                </div>

            </header>

            <section className="app-home-section" aria-labelledby="app-home-actions-title">
                <h3 className="app-home-section-title" id="app-home-actions-title">{copy.quickActions}</h3>

                <div className="app-home-tiles">
                    {QUICK_ACTIONS.map((action) => (
                        <button
                            key={action.id}
                            type="button"
                            className="app-home-tile"
                            onClick={() => goTo(action.path)}
                        >
                            <action.Icon className="app-home-tile-icon" />

                            <span className={`app-home-tile-label ${action.id === 'schooleverywhere' ? 'always-english-font' : ''}`}>
                                {copy.actions[action.id]}
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="app-home-section" aria-labelledby="app-home-upcoming-title">
                <div className="app-home-section-head">
                    <h3 className="app-home-section-title" id="app-home-upcoming-title">{copy.upcoming}</h3>

                    <button type="button" className="app-home-text-button" onClick={() => goTo('/events')}>
                        {copy.viewAll}
                    </button>
                </div>

                {upcomingEvents.length === 0 ? (
                    <p className="app-home-empty">{copy.upcomingEmpty}</p>
                ) : (
                    <ul className="app-home-list">
                        {upcomingEvents.map((event) => (
                            <li key={event.id}>
                                <button
                                    type="button"
                                    className="app-home-card app-home-event"
                                    onClick={() => goTo(event.isSharedByAllCalendars ? '/events' : event.calendarPath)}
                                >
                                    <span className="app-home-event-date">
                                        {shortDateFormatter.format(event.startDate)}
                                    </span>

                                    <span className="app-home-event-body">
                                        <span className="app-home-event-title">{event.title}</span>

                                        <span className="app-home-event-meta">
                                            {describeDistance(event.startDate)} · {describeDepartments(event)}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="app-home-section" aria-labelledby="app-home-alumni-title">
                <div className="app-home-section-head">
                    <h3 className="app-home-section-title" id="app-home-alumni-title">{copy.alumni}</h3>

                    {alumniIsStale && alumniHighlights.length > 0 ? (
                        <span className="app-home-chip">{copy.savedCopy}</span>
                    ) : (
                        <button
                            type="button"
                            className="app-home-text-button"
                            onClick={() => goTo(alumniStudentsPageUrl)}
                        >
                            {copy.viewAll}
                        </button>
                    )}
                </div>

                {alumniHighlights.length === 0 ? (
                    <p className="app-home-empty">{copy.alumniEmpty}</p>
                ) : (
                    <div className="app-home-alumni-list">
                        {alumniHighlights.map((post, index) => (
                            <AlumniPostCard
                                key={post.id || index}
                                post={post}
                                variant={'preview'}
                                onReadMore={() => goTo(alumniStudentsPageUrl)}
                                expandToFullOnReadMore={false}
                            />
                        ))}
                    </div>
                )}
            </section>

            <section className="app-home-section" aria-labelledby="app-home-device-title">
                <h3 className="app-home-section-title" id="app-home-device-title">{copy.device}</h3>

                <div className="app-home-list">
                    <button
                        type="button"
                        className="app-home-card app-home-device-row"
                        onClick={() => goTo('/events')}
                    >
                        <NotificationsActiveOutlinedIcon className="app-home-device-icon" />

                        <span className="app-home-device-body">
                            <span className="app-home-device-title">{copy.remindersTitle}</span>

                            <span className="app-home-device-detail">{describeReminders()}</span>
                        </span>

                        <span className="app-home-device-action">{copy.remindersAction}</span>
                    </button>

                    {isWidgetSupported() && (
                        <button
                            type="button"
                            className="app-home-card app-home-device-row"
                            onClick={() => setIsWidgetModalOpen(true)}
                        >
                            <WidgetsOutlinedIcon className="app-home-device-icon" />

                            <span className="app-home-device-body">
                                <span className="app-home-device-title">{copy.widgetTitle}</span>

                                <span className="app-home-device-detail">
                                    {widgetActionCount === 1
                                        ? copy.widgetOne
                                        : copy.widgetChosen(numberFormatter.format(widgetActionCount))}
                                </span>
                            </span>

                            <span className="app-home-device-action">{copy.widgetAction}</span>
                        </button>
                    )}

                    <button
                        type="button"
                        className="app-home-card app-home-device-row"
                        disabled={isOffline || isSavingOfflineContent}
                        onClick={handleSaveOfflineContent}
                    >
                        <CloudDownloadOutlinedIcon className="app-home-device-icon" />

                        <span className="app-home-device-body">
                            <span className="app-home-device-title">{copy.offlineTitle}</span>

                            <span className="app-home-device-detail">
                                {offlineSavedAt
                                    ? copy.offlineSavedOn(longDateFormatter.format(new Date(offlineSavedAt)))
                                    : copy.offlineNever}
                            </span>
                        </span>

                        <span className="app-home-device-action">
                            {isSavingOfflineContent ? copy.offlineWorking : copy.offlineAction}
                        </span>
                    </button>
                </div>

                {bundleVersion && (
                    <p className="app-home-version">
                        {copy.versionLabel}{' '}

                        <span className="app-home-version-value">{bundleVersion}</span>
                    </p>
                )}

                {appVersion && (
                    <p className="app-home-version">
                        {copy.appVersionLabel}{' '}

                        <span className="app-home-version-value">
                            {appVersion.version} ({appVersion.build})
                        </span>
                    </p>
                )}
            </section>

            <section className="app-home-section" aria-labelledby="app-home-connect-title">
                <h3 className="app-home-section-title" id="app-home-connect-title">{copy.connect}</h3>

                <div className="app-home-links">
                    {CONNECT_LINKS.map((link) => (
                        <button
                            key={link.id}
                            type="button"
                            className="app-home-card app-home-link"
                            disabled={isOffline && link.needsNetwork}
                            onClick={() => {
                                Haptics.impact({ style: ImpactStyle.Light }).catch(() => null)
                                openConnectLink(link.url)
                            }}
                        >
                            <link.Icon className="app-home-link-icon" />

                            <span className="app-home-link-label">{copy.links[link.id]}</span>
                        </button>
                    ))}
                </div>
            </section>

            <button
                type="button"
                className="app-home-card app-home-language-button"
                onClick={() => {
                    Haptics.impact({ style: ImpactStyle.Light }).catch(() => null)
                    toggleLanguage({})
                }}
            >
                <TranslateIcon className="app-home-language-icon" />

                <span className={`app-home-language-label ${language === 'ar' ? 'in-english' : 'in-arabic'}`}>
                    {copy.switchLanguage}
                </span>
            </button>

            {isWidgetSupported() && (
                <WidgetActionsControls
                    isOpen={isWidgetModalOpen}
                    catalogue={widgetCatalogue}
                    copy={copy}
                    language={language}
                    onClose={() => setIsWidgetModalOpen(false)}
                    onChosenCountChange={setWidgetActionCount}
                />
            )}
        </div>
    )
}


export default AppHome
