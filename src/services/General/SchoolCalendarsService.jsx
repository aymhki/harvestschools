import { endpoints, getCurrentLangCode } from './GeneralUtils.jsx'
import { cachedRequest } from './OfflineApiCacheService.jsx'


const PUBLIC_CALENDAR_SCHEMA_VERSION = 1

const SCHOOL_CALENDARS = [
    { id: 'national', label: { en: 'National', ar: 'ناشونال' }, titleKey: 'events-pages.national-calendar-page.title', path: '/events/national-calendar' },
    { id: 'british', label: { en: 'British', ar: 'بريطاني' }, titleKey: 'events-pages.british-calendar-page.title', path: '/events/british-calendar' },
    { id: 'american', label: { en: 'American', ar: 'أمريكي' }, titleKey: 'events-pages.american-calendar-page.title', path: '/events/american-calendar' },
    { id: 'national-kg', label: { en: 'National KG', ar: 'روضة ناشونال' }, titleKey: 'events-pages.kg-calendars-pages.national-kg-calendar.title', path: '/events/national-kg-calendar' },
    { id: 'british-kg', label: { en: 'British KG', ar: 'روضة بريطاني' }, titleKey: 'events-pages.kg-calendars-pages.british-kg-calendar.title', path: '/events/british-kg-calendar' },
    { id: 'american-kg', label: { en: 'American KG', ar: 'روضة أمريكي' }, titleKey: 'events-pages.kg-calendars-pages.american-kg-calendar.title', path: '/events/american-kg-calendar' },
]

const CALENDAR_LANGUAGES = ['en', 'ar']

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/


const getCalendarById = (calendarId) => SCHOOL_CALENDARS.find((calendar) => calendar.id === calendarId) || null


const startOfToday = () => {
    const today = new Date()

    today.setHours(0, 0, 0, 0)

    return today
}


const parseCalendarDate = (value, hour = 0) => {
    const match = CALENDAR_DATE_PATTERN.exec(String(value || '').trim())

    let parsed = null

    if (match) {
        const candidate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), hour, 0, 0, 0)

        parsed = Number.isNaN(candidate.getTime()) ? null : candidate
    }

    return parsed
}


const calendarCacheKey = (calendarId, language) => `public-calendar:${calendarId}:${language}`


const isCalendarDocumentUsable = (document) => Boolean(
    document
    && Number(document.schemaVersion) === PUBLIC_CALENDAR_SCHEMA_VERSION
    && Array.isArray(document.events)
)


const requestCalendar = async (calendarId, language) => {
    const params = new URLSearchParams()
    params.set('calendar', calendarId)
    params.set('lang', language)

    const response = await fetch(`${endpoints.getPublicCalendar}?${params.toString()}`, { method: 'GET' })
    const body = await response.json()

    if (!body || body.success !== true || !isCalendarDocumentUsable(body.data)) {
        throw new Error(body && body.message ? body.message : 'The calendar response was not usable')
    }

    return body.data
}


const toCalendarEvent = (row, calendar) => {
    const startDate = parseCalendarDate(row.startDate)

    const title = String(row.title || '').trim()

    if (!startDate || title === '') {
        return null
    }

    return {
        id: `${calendar.id}:${row.id}`,
        calendarId: calendar.id,
        calendarPath: calendar.path,
        calendarTitleKey: calendar.titleKey,
        calendarLabel: calendar.label,
        index: Number(row.sortOrder) || 0,
        title,
        startDate,
        endDate: parseCalendarDate(row.endDate) || startDate,
    }
}


const buildCalendarFromDocument = (calendarId, data) => {
    const calendar = getCalendarById(calendarId)

    if (!calendar || !isCalendarDocumentUsable(data)) {
        return null
    }

    return {
        calendarId,
        academicYear: data.academicYear,
        note: data.note || '',
        pdfPath: data.pdfPath || '',
        lastUpdated: Number(data.lastUpdated) || 0,
        events: data.events
            .map((row) => toCalendarEvent(row, calendar))
            .filter((event) => event !== null),
    }
}


const loadCalendar = async (calendarId, language) => {
    const calendar = getCalendarById(calendarId)

    if (!calendar) {
        return null
    }

    const normalisedLanguage = language || getCurrentLangCode()

    try {
        const { data } = await cachedRequest(
            calendarCacheKey(calendarId, normalisedLanguage),
            () => requestCalendar(calendarId, normalisedLanguage)
        )

        return buildCalendarFromDocument(calendarId, data)
    } catch (error) {
        console.log(error.message)

        return null
    }
}


const loadAllCalendars = async (language) => {
    const loaded = await Promise.all(SCHOOL_CALENDARS.map((calendar) => loadCalendar(calendar.id, language)))

    return loaded.filter((calendar) => calendar !== null)
}


const getUpcomingEvents = (events) => {
    const today = startOfToday()

    return (events || [])
        .filter((event) => event.endDate >= today)
        .sort((first, second) => first.startDate - second.startDate)
}


const getUpcomingEventsAcrossCalendars = (loadedCalendars, limit) => {
    const grouped = new Map();
    const finalLoadedCalendars = loadedCalendars || [];

    finalLoadedCalendars
        .flatMap((calendar) => getUpcomingEvents(calendar.events))
        .sort((first, second) => first.startDate - second.startDate)
        .forEach((event) => {
            const signature = `${event.title}|${event.startDate.toDateString()}`

            const existing = grouped.get(signature)

            if (existing) {
                existing.calendarIds.push(event.calendarId)
                existing.calendarLabels.push(event.calendarLabel)
            } else {
                grouped.set(signature, {
                    ...event,
                    id: signature,
                    calendarIds: [event.calendarId],
                    calendarLabels: [event.calendarLabel],
                })
            }
        })

    return Array.from(grouped.values())
        .map((event) => ({
            ...event,
            isSharedByAllCalendars: event.calendarIds.length === SCHOOL_CALENDARS.length,
        }))
        .slice(0, limit)
}



const prefetchCalendars = async ({ onProgress } = {}) => {
    const total = SCHOOL_CALENDARS.length * CALENDAR_LANGUAGES.length

    let completed = 0
    let updated = 0

    for (const calendar of SCHOOL_CALENDARS) {
        for (const language of CALENDAR_LANGUAGES) {
            if (await loadCalendar(calendar.id, language)) {
                updated += 1
            }

            completed += 1

            if (onProgress) {
                onProgress(Math.round((completed / total) * 100))
            }
        }
    }

    return { updated, total }
}


export {
    SCHOOL_CALENDARS,
    CALENDAR_LANGUAGES,
    buildCalendarFromDocument,
    getCalendarById,
    getUpcomingEvents,
    getUpcomingEventsAcrossCalendars,
    loadAllCalendars,
    loadCalendar,
    parseCalendarDate,
    prefetchCalendars,
    startOfToday,
}
