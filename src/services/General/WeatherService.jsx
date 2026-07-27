import { Preferences } from '@capacitor/preferences'
import { endpoints } from './GeneralUtils.jsx'



const WEATHER_CACHE_KEY = 'harvest_schools_weather'
const WEATHER_FRESH_FOR_MS = 15 * 60 * 1000
const WEATHER_STALE_AFTER_MS = 6 * 60 * 60 * 1000
const WEATHER_REQUEST_TIMEOUT_MS = 6000



const getDeviceTimeZone = () => {
    let timeZone = ''

    try {
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    } catch (timeZoneError) {
        console.warn('[weather] Could not read the device time zone', timeZoneError)
    }

    return timeZone
}

const readCachedWeather = async () => {
    let cached = null

    try {
        const { value } = await Preferences.get({ key: WEATHER_CACHE_KEY })

        const parsed = value ? JSON.parse(value) : null

        if (parsed && typeof parsed.temperature === 'number' && typeof parsed.readAt === 'number') {
            cached = parsed
        }
    } catch (cacheError) {
        console.warn('[weather] Could not read the saved reading', cacheError)
    }

    return cached
}


const writeCachedWeather = async (reading) => {
    try {
        await Preferences.set({ key: WEATHER_CACHE_KEY, value: JSON.stringify(reading) })
    } catch (cacheError) {
        console.warn('[weather] Could not save the reading', cacheError)
    }
}


const fetchWeatherReading = async () => {
    const controller = new AbortController()

    const timeoutHandle = setTimeout(() => controller.abort(), WEATHER_REQUEST_TIMEOUT_MS)

    let reading = null

    try {
        const url = `${endpoints.getCurrentWeather}?timeZone=${encodeURIComponent(getDeviceTimeZone())}`

        const response = await fetch(url, { signal: controller.signal })

        const result = response.ok ? await response.json() : null

        if (result && result.success) {
            reading = {
                temperature: Number(result.temperature),
                weatherCode: Number(result.weatherCode),
                isDay: Boolean(result.isDay),
                isNearby: Boolean(result.isNearby),
                city: result.city || '',
                cityArabic: result.cityArabic || result.city || '',
                readAt: Date.now(),
            }

            await writeCachedWeather(reading)
        }
    } catch (weatherError) {
        console.warn('[weather] The current weather could not be loaded', weatherError)
    } finally {
        clearTimeout(timeoutHandle)
    }

    return reading
}


const getCurrentWeather = async ({ allowNetwork = true, force = false } = {}) => {
    const cached = await readCachedWeather()
    const cachedAge = cached ? Date.now() - cached.readAt : Number.MAX_SAFE_INTEGER
    const needsRefresh = allowNetwork && (force || cachedAge > WEATHER_FRESH_FOR_MS)
    const reading = needsRefresh ? (await fetchWeatherReading()) || cached : cached
    let weather = null

    if (reading && (Date.now() - reading.readAt) < WEATHER_STALE_AFTER_MS) {
        weather = reading
    }

    return weather
}


export {
    getCurrentWeather,
}
