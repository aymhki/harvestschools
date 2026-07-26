import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import CalendarReminderControls from './CalendarReminderControls.jsx'
import { getCalendarById } from '../services/General/SchoolCalendarsService.jsx'
import { servePublicAsset } from '../services/General/GeneralServices.jsx'
import { isMobileApp } from '../services/General/GeneralUtils.jsx'


function CalendarActions({ calendarId }) {
    const { t } = useTranslation(['events-pages'])

    const calendar = getCalendarById(calendarId)

    const downloadButton = calendar && (
        <div
            className={'download-calendar-button-wrapper'}
            onClick={() => {
                window.open(servePublicAsset(calendar.pdfPath, { download: true }), '_blank')
            }}
        >
            <button className={'download-calendar-button'}>
                {t('events-pages.common.download-calendar-btn')}
            </button>
        </div>
    )

    return isMobileApp() ? <CalendarReminderControls calendarId={calendarId}/> : downloadButton
}


CalendarActions.propTypes = {
    calendarId: PropTypes.string.isRequired,
}


export default CalendarActions
