const SCHOOL_CALENDARS = [
    {
        id: 'national',
        label: { en: 'National', ar: 'ناشونال' },
        titleKey: 'events-pages.national-calendar-page.title',
        eventsKey: 'events-pages.national-calendar-page.calendar',
        path: '/events/national-calendar',
        pdfPath: '/documents/Calendars/national_calendar_2026.pdf',
    },
    {
        id: 'british',
        label: { en: 'British', ar: 'بريطاني' },
        titleKey: 'events-pages.british-calendar-page.title',
        eventsKey: 'events-pages.british-calendar-page.calendar',
        path: '/events/british-calendar',
        pdfPath: '/documents/Calendars/british_calendar_2026.pdf',
    },
    {
        id: 'american',
        label: { en: 'American', ar: 'أمريكي' },
        titleKey: 'events-pages.american-calendar-page.title',
        eventsKey: 'events-pages.american-calendar-page.calendar',
        path: '/events/american-calendar',
        pdfPath: '/documents/Calendars/american_calendar_2026.pdf',
    },
    {
        id: 'national-kg',
        label: { en: 'National KG', ar: 'روضة ناشونال' },
        titleKey: 'events-pages.kg-calendars-pages.national-kg-calendar.title',
        eventsKey: 'events-pages.kg-calendars-pages.national-kg-calendar.calendar',
        path: '/events/national-kg-calendar',
        pdfPath: '/documents/Calendars/national_kg_calendar_2026.pdf',
    },
    {
        id: 'british-kg',
        label: { en: 'British KG', ar: 'روضة بريطاني' },
        titleKey: 'events-pages.kg-calendars-pages.british-kg-calendar.title',
        eventsKey: 'events-pages.kg-calendars-pages.british-kg-calendar.calendar',
        path: '/events/british-kg-calendar',
        pdfPath: '/documents/Calendars/british_kg_calendar_2026.pdf',
    },
    {
        id: 'american-kg',
        label: { en: 'American KG', ar: 'روضة أمريكي' },
        titleKey: 'events-pages.kg-calendars-pages.american-kg-calendar.title',
        eventsKey: 'events-pages.kg-calendars-pages.american-kg-calendar.calendar',
        path: '/events/american-kg-calendar',
        pdfPath: '/documents/Calendars/american_kg_calendar_2026.pdf',
    },
]

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


const toCalendarEvent = (row, calendar, index) => {
    const startDate = row && typeof row === 'object' ? parseCalendarDate(row['start-date']) : null

    const title = row && typeof row === 'object' ? String(row.title || '').trim() : ''

    let event = null

    if (startDate && title !== '') {
        event = {
            id: `${calendar.id}:${index}`,
            calendarId: calendar.id,
            calendarPath: calendar.path,
            calendarTitleKey: calendar.titleKey,
            calendarLabel: calendar.label,
            index,
            title,
            startDate,
            endDate: parseCalendarDate(row['end-date']) || startDate,
        }
    }

    return event
}


const getCalendarEvents = (translate, calendar) => {
    const rows = translate(calendar.eventsKey, { returnObjects: true })

    return Array.isArray(rows)
        ? rows.map((row, index) => toCalendarEvent(row, calendar, index)).filter((event) => event !== null)
        : []
}


const getUpcomingCalendarEvents = (translate, calendar) => {
    const today = startOfToday()

    return getCalendarEvents(translate, calendar)
        .filter((event) => event.endDate >= today)
        .sort((first, second) => first.startDate - second.startDate)
}


const getUpcomingEventsAcrossCalendars = (translate, limit) => {
    const grouped = new Map()

    SCHOOL_CALENDARS
        .flatMap((calendar) => getUpcomingCalendarEvents(translate, calendar))
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


export {
    SCHOOL_CALENDARS,
    getCalendarById,
    getCalendarEvents,
    getUpcomingCalendarEvents,
    getUpcomingEventsAcrossCalendars,
    parseCalendarDate,
    startOfToday,
}
