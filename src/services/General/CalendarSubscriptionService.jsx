import { LocalNotifications } from '@capacitor/local-notifications'
import { Preferences } from '@capacitor/preferences'
import { isNativeRuntime } from './OfflineStorageService.jsx'
import {
    SCHOOL_CALENDARS,
    getCalendarById,
    getUpcomingEvents,
    loadCalendar,
} from './SchoolCalendarsService.jsx'


const SUBSCRIPTIONS_KEY = 'harvest_calendar_subscriptions'
const NOTIFICATION_CHANNEL_ID = 'harvest-school-events'
const NOTIFICATION_ID_BLOCK_SIZE = 1000
const TEST_NOTIFICATION_ID = 999999
const TEST_NOTIFICATION_DELAY_MS = 1000
const MAX_PENDING_NOTIFICATIONS = 56
const REMINDER_HOUR = 9
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const REMINDER_OFFSET_CHOICES = [
    { days: 0, labelKey: 'events-pages.common.reminder-offset-same-day' },
    { days: 1, labelKey: 'events-pages.common.reminder-offset-one-day-before' },
    { days: 7, labelKey: 'events-pages.common.reminder-offset-one-week-before' },
]

const DEFAULT_REMINDER_OFFSET_DAYS = REMINDER_OFFSET_CHOICES[1].days

let channelPromise = null


const readSubscriptions = async () => {
    let subscriptions = {}

    try {
        const { value } = await Preferences.get({ key: SUBSCRIPTIONS_KEY })

        const parsed = value ? JSON.parse(value) : null

        if (parsed && typeof parsed === 'object') {
            subscriptions = parsed
        }
    } catch (readError) {
        console.warn('[calendar-reminders] Could not read the saved subscriptions', readError)
    }

    return subscriptions
}


const writeSubscriptions = async (subscriptions) => {
    try {
        await Preferences.set({ key: SUBSCRIPTIONS_KEY, value: JSON.stringify(subscriptions) })
    } catch (writeError) {
        console.warn('[calendar-reminders] Could not save the subscriptions', writeError)
    }
}


const ensureNotificationChannel = async () => {
    if (!channelPromise) {
        channelPromise = LocalNotifications.createChannel({
            id: NOTIFICATION_CHANNEL_ID,
            name: 'School events',
            description: 'Reminders for the school calendars you follow',
            importance: 4,
            visibility: 1,
        }).catch(() => null)
    }

    return channelPromise
}


const getNotificationPermission = async () => {
    let state = 'unavailable'

    if (isNativeRuntime()) {
        try {
            const result = await LocalNotifications.checkPermissions()

            state = result.display
        } catch (permissionError) {
            console.warn('[calendar-reminders] Could not read the notification permission', permissionError)
        }
    }

    return state
}


const requestNotificationPermission = async () => {
    let state = 'unavailable'

    if (isNativeRuntime()) {
        try {
            const current = await LocalNotifications.checkPermissions()

            const result = current.display === 'prompt' || current.display === 'prompt-with-rationale'
                ? await LocalNotifications.requestPermissions()
                : current

            state = result.display
        } catch (permissionError) {
            console.warn('[calendar-reminders] Could not request the notification permission', permissionError)
        }
    }

    return state
}


const getNotificationIdBase = (calendarId) => {
    const index = SCHOOL_CALENDARS.findIndex((calendar) => calendar.id === calendarId)

    return (index + 1) * NOTIFICATION_ID_BLOCK_SIZE
}


const getPendingIdsForCalendar = async (calendarId) => {
    const idBase = getNotificationIdBase(calendarId)

    let ids = []

    try {
        const pending = await LocalNotifications.getPending()

        ids = (pending.notifications || [])
            .map((notification) => Number(notification.id))
            .filter((id) => id >= idBase && id < idBase + NOTIFICATION_ID_BLOCK_SIZE)
    } catch (pendingError) {
        console.warn('[calendar-reminders] Could not read the pending reminders', pendingError)
    }

    return ids
}


const getScheduledReminderCount = async (calendarId) => {
    let count = 0

    if (isNativeRuntime()) {
        count = (await getPendingIdsForCalendar(calendarId)).length
    }

    return count
}


const cancelCalendarNotifications = async (calendarId) => {
    const ids = await getPendingIdsForCalendar(calendarId)

    if (ids.length > 0) {
        await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) })
    }
}


const buildReminderDate = (startDate, offsetDays) => {
    const reminderDate = new Date(startDate.getTime() - offsetDays * MILLISECONDS_PER_DAY)

    reminderDate.setHours(REMINDER_HOUR, 0, 0, 0)

    return reminderDate
}


const buildNotifications = (calendar, events, offsetDays, limit, language) => {
    const now = Date.now()

    const idBase = getNotificationIdBase(calendar.id)

    const calendarTitle = calendar.label[language === 'ar' ? 'ar' : 'en']

    const dateFormatter = new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    })

    return events
        .map((event) => ({ event, reminderDate: buildReminderDate(event.startDate, offsetDays) }))
        .filter((entry) => entry.reminderDate.getTime() > now)
        .slice(0, limit)
        .map((entry) => ({
            id: idBase + entry.event.index,
            title: entry.event.title,
            body: `${calendarTitle} · ${dateFormatter.format(entry.event.startDate)}`,
            channelId: NOTIFICATION_CHANNEL_ID,
            extra: { route: calendar.path },
            schedule: { at: entry.reminderDate, allowWhileIdle: true },
        }))
}


const scheduleCalendarReminders = async (calendar, offsetDays, limit, language) => {
    const loaded = await loadCalendar(calendar.id, language)

    if (!loaded) {
        return 0
    }

    const events = getUpcomingEvents(loaded.events)

    const notifications = buildNotifications(calendar, events, offsetDays, limit, language)

    await cancelCalendarNotifications(calendar.id)

    if (notifications.length > 0) {
        await ensureNotificationChannel()

        await LocalNotifications.schedule({ notifications })
    }

    return notifications.length
}


const getCalendarSubscription = async (calendarId) => {
    const subscriptions = await readSubscriptions()

    return subscriptions[calendarId] || null
}


const getSubscribedCalendarIds = async () => {
    const subscriptions = isNativeRuntime() ? await readSubscriptions() : {}

    return Object.keys(subscriptions)
}


const subscribeToCalendar = async ({ calendarId, offsetDays = DEFAULT_REMINDER_OFFSET_DAYS, language }) => {
    const calendar = getCalendarById(calendarId)

    let result = { status: 'unavailable', scheduledCount: 0 }

    if (isNativeRuntime() && calendar) {
        const permission = await requestNotificationPermission()

        if (permission === 'granted') {
            const subscriptions = await readSubscriptions()

            subscriptions[calendarId] = { offsetDays, subscribedAt: Date.now() }

            await writeSubscriptions(subscriptions)

            const limit = Math.floor(MAX_PENDING_NOTIFICATIONS / Object.keys(subscriptions).length)

            const scheduledCount = await scheduleCalendarReminders(calendar, offsetDays, limit, language)

            result = { status: 'granted', scheduledCount }
        } else {
            result = { status: permission, scheduledCount: 0 }
        }
    }

    return result
}


const unsubscribeFromCalendar = async (calendarId) => {
    if (isNativeRuntime()) {
        const subscriptions = await readSubscriptions()

        delete subscriptions[calendarId]

        await writeSubscriptions(subscriptions)

        await cancelCalendarNotifications(calendarId)
    }
}


const rescheduleAllSubscriptions = async ({ language }) => {
    let rescheduled = 0

    if (isNativeRuntime()) {
        const subscriptions = await readSubscriptions()

        const calendarIds = Object.keys(subscriptions)

        const permission = await getNotificationPermission()

        if (calendarIds.length > 0 && permission === 'granted') {
            const limit = Math.floor(MAX_PENDING_NOTIFICATIONS / calendarIds.length)

            for (const calendarId of calendarIds) {
                const calendar = getCalendarById(calendarId)

                if (calendar) {
                    const offsetDays = subscriptions[calendarId].offsetDays ?? DEFAULT_REMINDER_OFFSET_DAYS

                    rescheduled += await scheduleCalendarReminders(calendar, offsetDays, limit, language)
                }
            }
        }
    }

    return rescheduled
}


const sendTestReminder = async ({ translate }) => {
    let status = 'unavailable'

    if (isNativeRuntime()) {
        const permission = await requestNotificationPermission()

        if (permission === 'granted') {
            await ensureNotificationChannel()

            await LocalNotifications.schedule({
                notifications: [{
                    id: TEST_NOTIFICATION_ID,
                    title: translate('events-pages.common.test-reminder-title'),
                    body: translate('events-pages.common.test-reminder-body'),
                    channelId: NOTIFICATION_CHANNEL_ID,
                    schedule: { at: new Date(Date.now() + TEST_NOTIFICATION_DELAY_MS), allowWhileIdle: true },
                }],
            })

            status = 'granted'
        } else {
            status = permission
        }
    }

    return status
}


const attachCalendarNotificationHandlers = (navigate) => {
    let cleanUp = () => null

    if (isNativeRuntime()) {
        const listenerPromise = LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
            const route = action.notification && action.notification.extra ? action.notification.extra.route : null

            if (route) {
                navigate(route)
            }
        })

        cleanUp = () => {
            listenerPromise.then((handle) => handle.remove()).catch(() => null)
        }
    }

    return cleanUp
}


export {
    DEFAULT_REMINDER_OFFSET_DAYS,
    REMINDER_OFFSET_CHOICES,
    attachCalendarNotificationHandlers,
    getCalendarSubscription,
    getNotificationPermission,
    getScheduledReminderCount,
    getSubscribedCalendarIds,
    rescheduleAllSubscriptions,
    sendTestReminder,
    subscribeToCalendar,
    unsubscribeFromCalendar,
}
