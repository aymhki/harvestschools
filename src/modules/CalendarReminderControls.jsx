import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from 'react-spring'
import { Haptics, NotificationType } from '@capacitor/haptics'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import NotificationsOffOutlinedIcon from '@mui/icons-material/NotificationsOffOutlined'
import Form from './Form.jsx'
import { getCalendarById } from '../services/General/SchoolCalendarsService.jsx'
import {
    DEFAULT_REMINDER_OFFSET_DAYS,
    REMINDER_OFFSET_CHOICES,
    getCalendarSubscription,
    getNotificationPermission,
    getScheduledReminderCount,
    subscribeToCalendar,
    unsubscribeFromCalendar,
} from '../services/General/CalendarSubscriptionService.jsx'
import '../styles/CalendarActions.css'


const REMINDER_OFFSET_FIELD_ID = 1


function CalendarReminderControls({ calendarId }) {
    const { t, i18n } = useTranslation(['events-pages', 'common'])

    const calendar = getCalendarById(calendarId)

    const language = i18n.language === 'ar' ? 'ar' : 'en'

    const [isModalOpen, setIsModalOpen] = useState(false)

    const [isSubscribed, setIsSubscribed] = useState(false)

    const [offsetDays, setOffsetDays] = useState(DEFAULT_REMINDER_OFFSET_DAYS)

    const [scheduledCount, setScheduledCount] = useState(0)

    const [isBlocked, setIsBlocked] = useState(false)

    const modalFooterButtonsRef = useRef(null)

    const animateModal = useSpring({
        opacity: isModalOpen ? 1 : 0,
        transform: isModalOpen ? 'translateY(0)' : 'translateY(-100%)',
        pointerEvents: isModalOpen ? 'auto' : 'none',
    })

    const offsetLabelsByDays = useMemo(
        () => new Map(REMINDER_OFFSET_CHOICES.map((choice) => [choice.days, t(choice.labelKey)])),
        [t]
    )

    const loadCurrentState = useCallback(async () => {
        const [subscription, permission, pendingCount] = await Promise.all([
            getCalendarSubscription(calendarId),
            getNotificationPermission(),
            getScheduledReminderCount(calendarId),
        ])

        setIsSubscribed(Boolean(subscription) && permission === 'granted')
        setOffsetDays(subscription ? subscription.offsetDays : DEFAULT_REMINDER_OFFSET_DAYS)
        setScheduledCount(pendingCount)
        setIsBlocked(permission === 'denied')
    }, [calendarId])

    const readSubmittedOffsetDays = (formData) => {
        const submittedLabel = String(formData.get(`field_${REMINDER_OFFSET_FIELD_ID}`) || '')

        const matchedChoice = REMINDER_OFFSET_CHOICES.find(
            (choice) => offsetLabelsByDays.get(choice.days) === submittedLabel
        )

        return matchedChoice ? matchedChoice.days : DEFAULT_REMINDER_OFFSET_DAYS
    }

    const closeModal = () => {
        setIsModalOpen(false)
    }

    const handleOpenModal = async () => {
        await loadCurrentState()

        setIsModalOpen(true)
    }

    const handleSubscribe = async (formData) => {
        const requestedOffsetDays = readSubmittedOffsetDays(formData)

        const result = await subscribeToCalendar({
            calendarId,
            offsetDays: requestedOffsetDays,
            translate: t,
            language,
        })

        setIsSubscribed(result.status === 'granted')
        setScheduledCount(result.scheduledCount)
        setOffsetDays(requestedOffsetDays)
        setIsBlocked(result.status === 'denied')

        if (result.status !== 'granted') {
            throw new Error(t('events-pages.common.notifications-blocked-note'))
        }

        Haptics.notification({ type: NotificationType.Success }).catch(() => null)

        closeModal()

        return true
    }

    const handleUnsubscribe = async () => {
        await unsubscribeFromCalendar(calendarId)

        setIsSubscribed(false)
        setScheduledCount(0)

        Haptics.notification({ type: NotificationType.Warning }).catch(() => null)
    }

    const reminderFormFields = useMemo(() => ([
        {
            id: REMINDER_OFFSET_FIELD_ID,
            type: 'select',
            name: 'reminder-offset',
            label: 'Reminder Offset',
            displayLabel: t('events-pages.common.reminder-offset-label'),
            required: true,
            errorMsg: t('events-pages.common.reminder-offset-label'),
            defaultValue: offsetLabelsByDays.get(offsetDays),
            setValue: null,
            widthOfField: 1,
            httpName: 'reminder-offset',
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
            choices: REMINDER_OFFSET_CHOICES.map((choice) => offsetLabelsByDays.get(choice.days)),
        },
    ]), [t, offsetDays, offsetLabelsByDays])

    useEffect(() => {
        loadCurrentState()
    }, [loadCurrentState])

    return calendar && (
        <>
            <div className={'calendar-actions'}>
                <button className={'calendar-actions-open-button'} onClick={handleOpenModal}>
                    <NotificationsActiveOutlinedIcon />

                    {isSubscribed
                        ? t('events-pages.common.update-reminders-btn')
                        : t('events-pages.common.subscribe-btn')}
                </button>

                {isSubscribed && (
                    <button className={'calendar-actions-unsubscribe-button'} onClick={handleUnsubscribe}>
                        <NotificationsOffOutlinedIcon />

                        {t('events-pages.common.unsubscribe-btn')}
                    </button>
                )}

                {isSubscribed && scheduledCount > 0 && (
                    <p className={'calendar-actions-note'}>
                        {t('events-pages.common.reminders-scheduled-note', { total: scheduledCount })}
                    </p>
                )}
            </div>

            <animated.div style={animateModal} className={'calendar-actions-modal'}>
                <div className={'calendar-actions-modal-overlay'} onClick={closeModal}/>

                <div className={'calendar-actions-modal-container'}>
                    <div className={'calendar-actions-modal-header'}>
                        <h3>{t('events-pages.common.notifications-modal-title')}</h3>
                    </div>

                    <div className={'calendar-actions-modal-content'}>
                        <p className={'calendar-actions-note'}>{t(calendar.titleKey)}</p>

                        {isModalOpen && (
                            <Form fields={reminderFormFields}
                                  mailTo={''}
                                  formTitle={'Calendar Notifications Form'}
                                  noInputFieldsCache={true}
                                  noCaptcha={true}
                                  noClearOption={true}
                                  noSuccessMessage={true}
                                  hasDifferentOnSubmitBehaviour={true}
                                  differentOnSubmitBehaviour={handleSubscribe}
                                  hasDifferentSubmitButtonText={true}
                                  differentSubmitButtonText={[
                                      isSubscribed
                                          ? t('events-pages.common.update-reminders-btn')
                                          : t('events-pages.common.subscribe-btn'),
                                      t('events-pages.common.saving-reminders-btn')
                                  ]}
                                  formInModalPopup={true}
                                  setShowFormModalPopup={setIsModalOpen}
                                  footerButtonsSpaceBetween={true}
                                  switchFooterButtonsOrder={true}
                                  formFooterButtonsAreOutside={true}
                                  footerButtonsPortalTarget={modalFooterButtonsRef}
                            />
                        )}

                        {isBlocked && (
                            <p className={'calendar-actions-note'}>
                                {t('events-pages.common.notifications-blocked-note')}
                            </p>
                        )}
                    </div>

                    <div className={'calendar-actions-modal-footer'}>
                        <button className={'calendar-actions-modal-cancel-button'} onClick={closeModal}>
                            {t('common.cancel', { ns: 'common', defaultValue: language === 'ar' ? 'إلغاء' : 'Cancel' })}
                        </button>

                        <div ref={modalFooterButtonsRef} className={'modal-footer-buttons-portal-target'}/>
                    </div>
                </div>
            </animated.div>
        </>
    )
}


CalendarReminderControls.propTypes = {
    calendarId: PropTypes.string.isRequired,
}


export default CalendarReminderControls
