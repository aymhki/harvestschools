import { Capacitor, registerPlugin } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { getQuickActionIconPath, QUICK_ACTION_ICON_VIEWPORT } from './QuickActionIconPaths.jsx'

const HomeWidget = registerPlugin('HomeWidget')

const WIDGET_ACTION_IDS_KEY = 'harvest_schools_widget_actions'

const MINIMUM_WIDGET_ACTIONS = 1

const WIDGET_SIZE_CAPACITIES = {
    small: 4,
    medium: 8,
    large: 16,
}

const DEFAULT_WIDGET_ACTION_IDS = ['calendars', 'booking', 'admission', 'gallery']


const isWidgetSupported = () => Capacitor.isNativePlatform()


const getWidgetActionIds = async () => {
    let actionIds = DEFAULT_WIDGET_ACTION_IDS

    try {
        const { value } = await Preferences.get({ key: WIDGET_ACTION_IDS_KEY })

        const parsed = value ? JSON.parse(value) : null

        if (Array.isArray(parsed) && parsed.length > 0) {
            actionIds = parsed
        }
    } catch (readError) {
        console.warn('[widget] Could not read the chosen actions', readError)
    }

    return actionIds
}


const setWidgetActionIds = async (actionIds) => {
    try {
        await Preferences.set({ key: WIDGET_ACTION_IDS_KEY, value: JSON.stringify(actionIds) })
    } catch (writeError) {
        console.warn('[widget] Could not save the chosen actions', writeError)
    }

    return actionIds
}


const buildWidgetPayload = ({ actionIds, catalogue, title, language }) => {
    const actionsById = new Map(catalogue.map((action) => [action.id, action]))

    const actions = actionIds
        .map((actionId) => actionsById.get(actionId))
        .filter((action) => Boolean(action))
        .map((action) => ({
            id: action.id,
            label: action.label,
            path: action.path,
            iconPath: getQuickActionIconPath(action.id),
        }))

    return {
        title,
        language,
        isRightToLeft: language === 'ar',
        iconViewport: QUICK_ACTION_ICON_VIEWPORT,
        actions,
        updatedAt: Date.now(),
    }
}


const syncWidgetQuickActions = async ({ actionIds, catalogue, title, language }) => {
    let isSynced = false

    if (isWidgetSupported()) {
        const payload = buildWidgetPayload({ actionIds, catalogue, title, language })

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
    MINIMUM_WIDGET_ACTIONS,
    WIDGET_SIZE_CAPACITIES,
    getWidgetActionIds,
    isWidgetSupported,
    setWidgetActionIds,
    syncWidgetQuickActions,
}
