import { Capacitor, registerPlugin } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const HomeWidget = registerPlugin('HomeWidget')
const WIDGET_ACTION_IDS_KEY = 'harvest_schools_widget_actions'
const MAXIMUM_WIDGET_ACTIONS = 12

const WIDGET_ACTION_ICONS = {
    calendars: '🗓️',
    booking: '🎓',
    admission: '📝',
    academics: '📚',
    studentsLife: '🧑‍🎓',
    gallery: '🖼️',
    moreInfo: 'ℹ️',
    vacancies: '💼',
    admin: '🔐',
    website: '🌐',
}

const DEFAULT_WIDGET_ACTION_IDS = ['calendars', 'booking', 'admission', 'gallery']


const isWidgetSupported = () => Capacitor.isNativePlatform()


const getWidgetActionIcon = (actionId) => WIDGET_ACTION_ICONS[actionId] || '🏫'


const getWidgetActionIds = async () => {
    let actionIds = DEFAULT_WIDGET_ACTION_IDS

    try {
        const { value } = await Preferences.get({ key: WIDGET_ACTION_IDS_KEY })

        const parsed = value ? JSON.parse(value) : null

        if (Array.isArray(parsed) && parsed.length > 0) {
            actionIds = parsed.slice(0, MAXIMUM_WIDGET_ACTIONS)
        }
    } catch (readError) {
        console.warn('[widget] Could not read the chosen actions', readError)
    }

    return actionIds
}


const setWidgetActionIds = async (actionIds) => {
    const chosen = actionIds.slice(0, MAXIMUM_WIDGET_ACTIONS)

    try {
        await Preferences.set({ key: WIDGET_ACTION_IDS_KEY, value: JSON.stringify(chosen) })
    } catch (writeError) {
        console.warn('[widget] Could not save the chosen actions', writeError)
    }

    return chosen
}


const buildWidgetPayload = ({ actionIds, catalogue, title, isRightToLeft }) => {
    const actionsById = new Map(catalogue.map((action) => [action.id, action]))

    const actions = actionIds
        .map((actionId) => actionsById.get(actionId))
        .filter((action) => Boolean(action))
        .map((action) => ({
            id: action.id,
            label: action.label,
            icon: getWidgetActionIcon(action.id),
            path: action.path,
        }))

    return { title, isRightToLeft, actions, updatedAt: Date.now() }
}


const syncWidgetQuickActions = async ({ actionIds, catalogue, title, isRightToLeft }) => {
    let isSynced = false

    if (isWidgetSupported()) {
        const payload = buildWidgetPayload({ actionIds, catalogue, title, isRightToLeft })

        try {
            await HomeWidget.setQuickActions({ payload: JSON.stringify(payload) })

            isSynced = true
        } catch (syncError) {
            console.warn('[widget] Could not hand the actions to the widget', syncError)
        }
    }

    return isSynced
}


export {
    DEFAULT_WIDGET_ACTION_IDS,
    MAXIMUM_WIDGET_ACTIONS,
    getWidgetActionIcon,
    getWidgetActionIds,
    isWidgetSupported,
    setWidgetActionIds,
    syncWidgetQuickActions,
}
