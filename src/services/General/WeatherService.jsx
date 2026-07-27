import { Preferences } from '@capacitor/preferences'
import { findCityAtCoordinates, findCityByName } from './GooglePlacesService.jsx'


const WEATHER_URL = 'https://weather.googleapis.com/v1/currentConditions:lookup'
const IP_LOOKUP_URL = 'https://ipwho.is/?fields=success,latitude,longitude,city,country_code,timezone'
const WEATHER_CACHE_KEY = 'harvest_schools_weather_conditions'
const LOCATION_CACHE_KEY = 'harvest_schools_weather_location'
const ARABIC_CITY_CACHE_KEY = 'harvest_schools_weather_arabic_cities'
const WEATHER_FRESH_FOR_MS = 15 * 60 * 1000
const WEATHER_STALE_AFTER_MS = 6 * 60 * 60 * 1000
const LOCATION_FRESH_FOR_MS = 12 * 60 * 60 * 1000
const ARABIC_CITY_FRESH_FOR_MS = 30 * 24 * 60 * 60 * 1000
const REQUEST_TIMEOUT_MS = 6000

const SCHOOL_LOCATION = {
    latitude: 30.868058,
    longitude: 29.59631,
    city: 'Borg Al-Arab',
    cityArabic: 'برج العرب',
    isNearby: false,
}


const getApiKey = () => import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''


const readStore = async (key) => {
    let stored = null

    try {
        const { value } = await Preferences.get({ key })

        stored = value ? JSON.parse(value) : null
    } catch (readError) {
        console.warn('[weather] Could not read a saved value', readError)
    }

    return stored
}


const writeStore = async (key, value) => {
    try {
        await Preferences.set({ key, value: JSON.stringify(value) })
    } catch (writeError) {
        console.warn('[weather] Could not save a value', writeError)
    }
}


const fetchJson = async (url) => {
    const controller = new AbortController()
    const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    let result = null

    try {
        const response = await fetch(url, { signal: controller.signal })
        result = response.ok ? await response.json() : null
    } catch (requestError) {
        console.warn('[weather] A lookup failed', requestError)
    } finally {
        clearTimeout(timeoutHandle)
    }

    return result
}


const getDeviceTimeZone = () => {
    let timeZone = ''

    try {
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    } catch (timeZoneError) {
        console.warn('[weather] Could not read the device time zone', timeZoneError)
    }

    return timeZone
}


const getCityOfTimeZone = (timeZone) => String(timeZone).split('/').pop().replace(/_/g, ' ')


const locateByIp = async () => {
    const lookup = await fetchJson(IP_LOOKUP_URL)
    let location = null

    if (lookup && lookup.success && Number.isFinite(lookup.latitude) && Number.isFinite(lookup.longitude)) {
        const zone = lookup.timezone

        location = {
            latitude: lookup.latitude,
            longitude: lookup.longitude,
            city: String(lookup.city || ''),
            countryCode: String(lookup.country_code || ''),
            timeZone: zone && typeof zone === 'object' ? String(zone.id || '') : String(zone || ''),
            isNearby: true,
        }
    }

    return location
}


const locateByTimeZone = async (timeZone, countryCode) => {
    const city = await findCityByName(getCityOfTimeZone(timeZone), countryCode, 'en')

    return city && city.latitude !== null
        ? { latitude: city.latitude, longitude: city.longitude, city: city.name, timeZone, isNearby: true }
        : null
}


const resolveLocation = async () => {
    const cached = await readStore(LOCATION_CACHE_KEY)

    if (cached && cached.location && Date.now() - cached.readAt < LOCATION_FRESH_FOR_MS) {
        return cached.location
    }

    const deviceTimeZone = getDeviceTimeZone()
    const ipLocation = await locateByIp()
    let location = ipLocation
    const ipLooksWrong = deviceTimeZone !== '' && (ipLocation === null || ipLocation.timeZone !== deviceTimeZone)

    if (ipLooksWrong && getApiKey() !== '') {
        const countryCode = ipLocation ? ipLocation.countryCode : ''

        location = (await locateByTimeZone(deviceTimeZone, countryCode)) || ipLocation
    }

    if (location === null) {
        location = SCHOOL_LOCATION
    }

    await writeStore(LOCATION_CACHE_KEY, { location, readAt: Date.now() })

    return location
}

const getArabicCity = async (location) => {
    if (location.cityArabic) {
        return location.cityArabic
    }

    const cacheKey = `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`

    const cached = (await readStore(ARABIC_CITY_CACHE_KEY)) || {}

    const entry = cached[cacheKey]

    if (entry && Date.now() - entry.readAt < ARABIC_CITY_FRESH_FOR_MS) {
        return entry.city
    }

    const city = await findCityAtCoordinates(location.latitude, location.longitude, 'ar')

    if (city && city.name !== '') {
        await writeStore(ARABIC_CITY_CACHE_KEY, {
            ...cached,
            [cacheKey]: { city: city.name, readAt: Date.now() },
        })
    }

    return city && city.name !== '' ? city.name : location.city
}


const fetchReading = async () => {
    let reading = null

    if (getApiKey() !== '') {
        const location = await resolveLocation()

        const url = `${WEATHER_URL}?key=${encodeURIComponent(getApiKey())}`
            + `&location.latitude=${location.latitude}`
            + `&location.longitude=${location.longitude}`
            + '&unitsSystem=METRIC'
            + '&languageCode=en'

        const result = await fetchJson(url)

        const temperature = result && result.temperature ? result.temperature.degrees : null

        if (Number.isFinite(temperature)) {
            reading = {
                temperature: Math.round(temperature),
                condition: String((result.weatherCondition && result.weatherCondition.type) || ''),
                isDay: Boolean(result.isDaytime),
                isNearby: Boolean(location.isNearby),
                city: location.city,
                cityArabic: await getArabicCity(location),
                readAt: Date.now(),
            }

            await writeStore(WEATHER_CACHE_KEY, reading)
        }
    }

    return reading
}


const getCurrentWeather = async ({ allowNetwork = true, force = false } = {}) => {
    const cached = await readStore(WEATHER_CACHE_KEY)
    const cachedAge = cached && cached.readAt ? Date.now() - cached.readAt : Number.MAX_SAFE_INTEGER
    const needsRefresh = allowNetwork && (force || cachedAge > WEATHER_FRESH_FOR_MS)
    const reading = needsRefresh ? (await fetchReading()) || cached : cached
    let weather = null

    if (reading && (Date.now() - reading.readAt) < WEATHER_STALE_AFTER_MS) {
        weather = reading
    }

    return weather
}


export {
    getCurrentWeather,
}
