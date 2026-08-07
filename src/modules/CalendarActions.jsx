import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import CalendarReminderControls from './CalendarReminderControls.jsx'
import { servePublicAsset } from '../services/General/GeneralServices.jsx'
import { isMobileApp } from '../services/General/GeneralUtils.jsx'
import '../styles/CalendarActions.css'

function CalendarActions({ calendarId, pdfPath }) {
    const { t } = useTranslation(['events-pages'])

    const downloadButton = pdfPath ? (
        <div
            className={'download-calendar-button-wrapper'}
            onClick={() => {
                window.open(servePublicAsset(pdfPath, { download: true }), '_blank')
            }}
        >
            <button className={'download-calendar-button'}>
                {t('events-pages.common.download-calendar-btn')}
            </button>
        </div>
    ) : null

    return isMobileApp() ? <CalendarReminderControls calendarId={calendarId}/> : downloadButton
}


CalendarActions.propTypes = {
    calendarId: PropTypes.string.isRequired,
    pdfPath: PropTypes.string,
}


export default CalendarActions
