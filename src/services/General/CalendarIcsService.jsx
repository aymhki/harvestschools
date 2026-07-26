import { getUpcomingCalendarEvents } from './SchoolCalendarsService.jsx'
import { shareFileFromBlob } from './NativeFileShareService.jsx'


const ICS_MIME_TYPE = 'text/calendar'

const ICS_LINE_BREAK = '\r\n'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000


const toIcsDate = (date) => {
    const year = date.getFullYear()

    const month = String(date.getMonth() + 1).padStart(2, '0')

    const day = String(date.getDate()).padStart(2, '0')

    return `${year}${month}${day}`
}


const escapeIcsText = (value) => String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')


const buildIcsEvent = (event, calendarTitle, stamp) => {
    const endDate = new Date(event.endDate.getTime() + MILLISECONDS_PER_DAY)

    return [
        'BEGIN:VEVENT',
        `UID:${event.calendarId}-${event.index}@harvestschools.com`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${toIcsDate(event.startDate)}`,
        `DTEND;VALUE=DATE:${toIcsDate(endDate)}`,
        `SUMMARY:${escapeIcsText(event.title)}`,
        `DESCRIPTION:${escapeIcsText(calendarTitle)}`,
        'END:VEVENT',
    ]
}


const buildCalendarIcs = (events, calendarTitle) => {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Harvest International School//School Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${escapeIcsText(calendarTitle)}`,
        ...events.flatMap((event) => buildIcsEvent(event, calendarTitle, stamp)),
        'END:VCALENDAR',
    ]

    return lines.join(ICS_LINE_BREAK) + ICS_LINE_BREAK
}


const shareCalendarAsIcs = async (calendar, translate) => {
    const events = getUpcomingCalendarEvents(translate, calendar)

    let shared = false

    if (events.length > 0) {
        const calendarTitle = translate(calendar.titleKey)

        const blob = new Blob([buildCalendarIcs(events, calendarTitle)], { type: ICS_MIME_TYPE })

        shared = await shareFileFromBlob(blob, `harvest-${calendar.id}-calendar.ics`, calendarTitle)
    }

    return shared
}


export {
    buildCalendarIcs,
    shareCalendarAsIcs,
}
