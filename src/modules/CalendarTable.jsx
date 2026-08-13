import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import Table from './Table.jsx'
import Spinner from './Spinner.jsx'
import CalendarActions from './CalendarActions.jsx'
import { buildCalendarFromDocument, loadCalendar } from '../services/General/SchoolCalendarsService.jsx'
import { usePreloadedData } from '../services/General/PrerenderDataContext.jsx'

function CalendarTable({ calendarId, title, className }) {
    const { t, i18n } = useTranslation(['events-pages', 'common'])

    const language = i18n.language === 'ar' ? 'ar' : 'en'
    const preloadedDocument = usePreloadedData(`calendar:${calendarId}:${language}`)
    const preloaded = useMemo(
        () => (preloadedDocument ? buildCalendarFromDocument(calendarId, preloadedDocument) : null),
        [calendarId, preloadedDocument]
    )

    const [calendar, setCalendar] = useState(preloaded)
    const [isLoading, setIsLoading] = useState(!preloaded)
    const [hasFailed, setHasFailed] = useState(false)

    useEffect(() => {
        let isActive = true

        if (!preloaded) {
            setIsLoading(true)
            setHasFailed(false)
        }

        loadCalendar(calendarId, language)
            .then((data) => {
                if (!isActive) {
                    return
                }

                if (data) {
                    setCalendar(data)
                    setHasFailed(false)
                } else if (!preloaded) {
                    setCalendar(null)
                    setHasFailed(true)
                }
            })
            .catch(() => {
                if (isActive && !preloaded) {
                    setCalendar(null)
                    setHasFailed(true)
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false)
                }
            })

        return () => {
            isActive = false
        }
    }, [calendarId, language, preloaded])

    const dateFormatter = useMemo(() => new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Africa/Cairo',
    }), [language])

    const tableData = useMemo(() => {
        const headers = [
            t('events-pages.common.calendar-title-column-header'),
            t('events-pages.common.calendar-start-date-column-header'),
            t('events-pages.common.calendar-end-date-column-header'),
        ]

        const rows = (calendar?.events || []).map((event) => [
            event.title,
            dateFormatter.format(event.startDate),
            dateFormatter.format(event.endDate),
        ])

        return [headers, ...rows]
    }, [calendar, dateFormatter, t, i18n.language])

    const formattedLastUpdated = useMemo(() => (
        calendar?.lastUpdated
            ? dateFormatter.format(new Date(calendar.lastUpdated * 1000))
            : ''
    ), [calendar, dateFormatter])

    return (
        <div className={className}>
            {isLoading && <Spinner/>}

            <div className={'extreme-padding-container'}>
                <h1>{title}</h1>

                {hasFailed && <p>{t('events-pages.common.calendar-unavailable')}</p>}

                {calendar?.note && <p>{calendar.note}</p>}

                <Table tableData={tableData} numCols={3} ignoreSideMarginsOnFixed={true}/>

                <CalendarActions calendarId={calendarId} pdfPath={calendar?.pdfPath || ''}/>

                {formattedLastUpdated && (
                    <p>
                        {t('common.last-updated', { ns: 'common' })} {formattedLastUpdated}
                    </p>
                )}
            </div>
        </div>
    )
}


CalendarTable.propTypes = {
    calendarId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    className: PropTypes.string.isRequired,
}


export default CalendarTable
