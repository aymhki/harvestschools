const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText'
const PLACES_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby'
const PLACES_CITY_FIELD_MASK = 'places.displayName,places.location'
const PLACES_CITY_TYPE = 'locality'
const PLACES_CITY_SEARCH_RADIUS_METRES = 50000
const PLACES_FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.location'
const PLACES_MAX_RESULTS = 8
const PLACES_MIN_QUERY_LENGTH = 3
const getApiKey = () => import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''


const toPlace = (place) => {
    const name = (place.displayName && place.displayName.text) || ''

    const address = place.formattedAddress || ''

    return {
        label: name !== '' && address !== '' ? `${name} — ${address}` : `${name}${address}`,
        name: name !== '' ? name : address,
        address,
        placeId: place.id || null,
        latitude: place.location ? place.location.latitude : null,
        longitude: place.location ? place.location.longitude : null,
    }
}


const searchPlaces = async (query, languageCode = 'en') => {
    const trimmedQuery = String(query || '').trim()

    let places = []

    if (trimmedQuery.length >= PLACES_MIN_QUERY_LENGTH && getApiKey() !== '') {
        try {
            const response = await fetch(PLACES_SEARCH_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': getApiKey(),
                    'X-Goog-FieldMask': PLACES_FIELD_MASK,
                },
                body: JSON.stringify({
                    textQuery: trimmedQuery,
                    maxResultCount: PLACES_MAX_RESULTS,
                    languageCode,
                }),
            })

            const result = await response.json()

            if (result && Array.isArray(result.places)) {
                places = result.places.map(toPlace).filter((place) => place.label !== '')
            } else if (result && result.error) {
                console.warn('The places lookup failed', result.error.message)
            }
        } catch (searchError) {
            console.warn('The places lookup failed', searchError)
        }
    }

    return places
}


const requestPlaces = async (url, body) => {
    let places = []

    if (getApiKey() !== '') {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': getApiKey(),
                    'X-Goog-FieldMask': PLACES_CITY_FIELD_MASK,
                },
                body: JSON.stringify(body),
            })

            const result = await response.json()

            if (result && Array.isArray(result.places)) {
                places = result.places
            } else if (result && result.error) {
                console.warn('The city lookup failed', result.error.message)
            }
        } catch (lookupError) {
            console.warn('The city lookup failed', lookupError)
        }
    }

    return places
}


const toCity = (place) => ({
    name: (place.displayName && place.displayName.text) || '',
    latitude: place.location ? place.location.latitude : null,
    longitude: place.location ? place.location.longitude : null,
})


const findCityByName = async (cityName, countryCode = '', languageCode = 'en') => {
    const places = await requestPlaces(PLACES_SEARCH_URL, {
        textQuery: cityName,
        includedType: PLACES_CITY_TYPE,
        strictTypeFiltering: true,
        regionCode: countryCode ? countryCode.toLowerCase() : undefined,
        languageCode,
        maxResultCount: 1,
    })

    return places.length > 0 ? toCity(places[0]) : null
}


const findCityAtCoordinates = async (latitude, longitude, languageCode = 'en') => {
    const places = await requestPlaces(PLACES_NEARBY_URL, {
        includedTypes: [PLACES_CITY_TYPE],
        rankPreference: 'DISTANCE',
        languageCode,
        maxResultCount: 1,
        locationRestriction: {
            circle: {
                center: { latitude, longitude },
                radius: PLACES_CITY_SEARCH_RADIUS_METRES,
            },
        },
    })

    return places.length > 0 ? toCity(places[0]) : null
}


const isPlacesSearchAvailable = () => getApiKey() !== ''


export {
    PLACES_MIN_QUERY_LENGTH,
    findCityAtCoordinates,
    findCityByName,
    isPlacesSearchAvailable,
    searchPlaces,
}
