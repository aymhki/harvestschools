import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { Haptics, NotificationType } from '@capacitor/haptics'
import Form from './Form.jsx'
import { getCalendarById } from '../services/General/SchoolCalendarsService.jsx'
import { shareCalendarAsIcs } from '../services/General/CalendarIcsService.jsx'
import {
    DEFAULT_REMINDER_OFFSET_DAYS,
    REMINDER_OFFSET_CHOICES,
    getCalendarSubscription,
    getNotificationPermission,
    getScheduledReminderCount,
    sendTestReminder,
    subscribeToCalendar,
    unsubscribeFromCalendar,
} from '../services/General/CalendarSubscriptionService.jsx'
import '../styles/CalendarActions.css'


const REMINDER_OFFSET_FIELD_ID = 1
const ADD_TO_CALENDAR_FIELD_ID = 2
const UNSUBSCRIBE_FIELD_ID = 3
const TEST_REMINDER_FIELD_ID = 4


function CalendarReminderControls({ calendarId }) {
    const { t, i18n } = useTranslation(['events-pages'])
    const calendar = getCalendarById(calendarId)
    const language = i18n.language === 'ar' ? 'ar' : 'en'
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [offsetDays, setOffsetDays] = useState(DEFAULT_REMINDER_OFFSET_DAYS)
    const [scheduledCount, setScheduledCount] = useState(0)
    const [isBlocked, setIsBlocked] = useState(false)
    const [, setIsBusy] = useState(false)
    const offsetLabelsByDays = useMemo(
        () => new Map(REMINDER_OFFSET_CHOICES.map((choice) => [choice.days, t(choice.labelKey)])),
        [t]
    )

    const readSubmittedOffsetDays = useCallback((formData) => {
        const submittedLabel = String(formData.get(`field_${REMINDER_OFFSET_FIELD_ID}`) || '')

        const matchedChoice = REMINDER_OFFSET_CHOICES.find(
            (choice) => offsetLabelsByDays.get(choice.days) === submittedLabel
        )

        return matchedChoice ? matchedChoice.days : DEFAULT_REMINDER_OFFSET_DAYS
    }, [offsetLabelsByDays])

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

        return true
    }

    const handleUnsubscribe = async () => {
        setIsBusy(true)

        await unsubscribeFromCalendar(calendarId)

        setIsSubscribed(false)
        setScheduledCount(0)
        setIsBusy(false)

        Haptics.notification({ type: NotificationType.Warning }).catch(() => null)
    }

    const handleAddToDeviceCalendar = async () => {
        setIsBusy(true)

        try {
            await shareCalendarAsIcs(calendar, t)
        } catch (shareError) {
            console.warn('Could not export the calendar', shareError)
        }

        setIsBusy(false)
    }

    const handleTestReminder = async () => {
        setIsBusy(true)

        const status = await sendTestReminder({ translate: t })

        setIsBlocked(status === 'denied')
        setIsBusy(false)
    }

    const reminderFormFields = useMemo(() => {
        const fields = [
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
                widthOfField: 2,
                httpName: 'reminder-offset',
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                choices: REMINDER_OFFSET_CHOICES.map((choice) => offsetLabelsByDays.get(choice.days)),
            },
            {
                id: ADD_TO_CALENDAR_FIELD_ID,
                type: 'button',
                name: 'add-to-device-calendar',
                label: t('events-pages.common.add-to-device-calendar-btn'),
                displayLabel: t('events-pages.common.add-to-device-calendar-btn'),
                required: false,
                widthOfField: 2,
                httpName: 'add-to-device-calendar',
                onClick: handleAddToDeviceCalendar,
            },
        ]

        if (isSubscribed) {
            fields.push({
                id: UNSUBSCRIBE_FIELD_ID,
                type: 'button',
                name: 'unsubscribe',
                label: t('events-pages.common.unsubscribe-btn'),
                displayLabel: t('events-pages.common.unsubscribe-btn'),
                required: false,
                widthOfField: 2,
                httpName: 'unsubscribe',
                onClick: handleUnsubscribe,
            })

            fields.push({
                id: TEST_REMINDER_FIELD_ID,
                type: 'button',
                name: 'test-reminder',
                label: t('events-pages.common.test-reminder-btn'),
                displayLabel: t('events-pages.common.test-reminder-btn'),
                required: false,
                widthOfField: 2,
                httpName: 'test-reminder',
                onClick: handleTestReminder,
            })
        }

        return fields
    }, [t, offsetDays, offsetLabelsByDays, isSubscribed])

    useEffect(() => {
        let isActive = true

        const loadCurrentState = async () => {
            const [subscription, permission, pendingCount] = await Promise.all([
                getCalendarSubscription(calendarId),
                getNotificationPermission(),
                getScheduledReminderCount(calendarId),
            ])

            if (isActive) {
                setIsSubscribed(Boolean(subscription) && permission === 'granted')
                setOffsetDays(subscription ? subscription.offsetDays : DEFAULT_REMINDER_OFFSET_DAYS)
                setScheduledCount(pendingCount)
                setIsBlocked(permission === 'denied')
            }
        }

        loadCurrentState()

        return () => {
            isActive = false
        }
    }, [calendarId])

    return calendar && (
        <div className={'calendar-actions'}>
            <Form fields={reminderFormFields}
                  mailTo={''}
                  formTitle={'Calendar Reminders Form'}
                  noInputFieldsCache={true}
                  noCaptcha={true}
                  noClearOption={true}
                  noSuccessMessage={true}
                  centerSubmitButton={true}
                  hasDifferentOnSubmitBehaviour={true}
                  differentOnSubmitBehaviour={handleSubscribe}
                  hasDifferentSubmitButtonText={true}
                  differentSubmitButtonText={[
                      isSubscribed
                          ? t('events-pages.common.update-reminders-btn')
                          : t('events-pages.common.subscribe-btn'),
                      t('events-pages.common.saving-reminders-btn')
                  ]}
                  hasSetSubmittingLocal={true}
                  setSubmittingLocal={setIsBusy}
            />

            {isSubscribed && scheduledCount > 0 && (
                <p className={'calendar-actions-note'}>
                    {t('events-pages.common.reminders-scheduled-note', { total: scheduledCount })}
                </p>
            )}

            {isBlocked && (
                <p className={'calendar-actions-note'}>
                    {t('events-pages.common.notifications-blocked-note')}
                </p>
            )}
        </div>
    )
}


CalendarReminderControls.propTypes = {
    calendarId: PropTypes.string.isRequired,
}


export default CalendarReminderControls
