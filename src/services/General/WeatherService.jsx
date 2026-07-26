import { Preferences } from '@capacitor/preferences'
import { endpoints } from './GeneralUtils.jsx'



const WEATHER_CACHE_KEY = 'harvest_schools_weather'
const WEATHER_FRESH_FOR_MS = 15 * 60 * 1000
const WEATHER_STALE_AFTER_MS = 6 * 60 * 60 * 1000
const WEATHER_REQUEST_TIMEOUT_MS = 6000

const WEATHER_CONDITIONS = [
    { codes: [0], dayIcon: '☀️', nightIcon: '🌙', en: 'Clear sky', ar: 'صافية' },
    { codes: [1, 2], dayIcon: '🌤️', nightIcon: '🌙', en: 'Partly cloudy', ar: 'غائمة جزئيًا' },
    { codes: [3], dayIcon: '☁️', nightIcon: '☁️', en: 'Overcast', ar: 'غائمة' },
    { codes: [45, 48], dayIcon: '🌫️', nightIcon: '🌫️', en: 'Fog', ar: 'ضباب' },
    { codes: [51, 53, 55, 56, 57], dayIcon: '🌦️', nightIcon: '🌦️', en: 'Drizzle', ar: 'رشات خفيفة' },
    { codes: [61, 63, 65, 66, 67], dayIcon: '🌧️', nightIcon: '🌧️', en: 'Rain', ar: 'أمطار' },
    { codes: [71, 73, 75, 77], dayIcon: '🌨️', nightIcon: '🌨️', en: 'Snow', ar: 'ثلوج' },
    { codes: [80, 81, 82], dayIcon: '🌦️', nightIcon: '🌦️', en: 'Rain showers', ar: 'زخات مطر' },
    { codes: [85, 86], dayIcon: '🌨️', nightIcon: '🌨️', en: 'Snow showers', ar: 'زخات ثلج' },
    { codes: [95, 96, 99], dayIcon: '⛈️', nightIcon: '⛈️', en: 'Thunderstorm', ar: 'عواصف رعدية' },
]

const FALLBACK_CONDITION = { dayIcon: '🌡️', nightIcon: '🌡️', en: 'Current weather', ar: 'حالة الطقس' }


const describeWeatherCode = (weatherCode, isDay, language) => {
    const condition = WEATHER_CONDITIONS.find((entry) => entry.codes.includes(weatherCode)) || FALLBACK_CONDITION

    return {
        icon: isDay ? condition.dayIcon : condition.nightIcon,
        label: language === 'ar' ? condition.ar : condition.en,
    }
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
        const response = await fetch(endpoints.getCurrentWeather, { signal: controller.signal })

        const result = response.ok ? await response.json() : null

        if (result && result.success) {
            reading = {
                temperature: Number(result.temperature),
                weatherCode: Number(result.weatherCode),
                isDay: Boolean(result.isDay),
                isNearby: Boolean(result.isNearby),
                city: result.city || '',
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


const getCurrentWeather = async ({ language, allowNetwork = true } = {}) => {
    const cached = await readCachedWeather()

    const cachedAge = cached ? Date.now() - cached.readAt : Number.MAX_SAFE_INTEGER

    const needsRefresh = allowNetwork && cachedAge > WEATHER_FRESH_FOR_MS

    const reading = needsRefresh ? (await fetchWeatherReading()) || cached : cached

    let weather = null

    if (reading && (Date.now() - reading.readAt) < WEATHER_STALE_AFTER_MS) {
        weather = {
            ...reading,
            ...describeWeatherCode(reading.weatherCode, reading.isDay, language),
        }
    }

    return weather
}


export {
    getCurrentWeather,
    describeWeatherCode,
}
