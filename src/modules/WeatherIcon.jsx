import PropTypes from 'prop-types'
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined'
import NightlightOutlinedIcon from '@mui/icons-material/NightlightOutlined'
import WbCloudyOutlinedIcon from '@mui/icons-material/WbCloudyOutlined'
import NightsStayOutlinedIcon from '@mui/icons-material/NightsStayOutlined'
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined'
import AirOutlinedIcon from '@mui/icons-material/AirOutlined'
import GrainOutlinedIcon from '@mui/icons-material/GrainOutlined'
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined'
import UmbrellaOutlinedIcon from '@mui/icons-material/UmbrellaOutlined'
import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined'
import ThunderstormOutlinedIcon from '@mui/icons-material/ThunderstormOutlined'
import ThermostatOutlinedIcon from '@mui/icons-material/ThermostatOutlined'


const WEATHER_CONDITIONS = [
    {
        types: ['CLEAR'],
        DayIcon: WbSunnyOutlinedIcon,
        NightIcon: NightlightOutlinedIcon,
        en: 'Clear sky',
        ar: 'صافية',
    },
    {
        types: ['MOSTLY_CLEAR'],
        DayIcon: WbSunnyOutlinedIcon,
        NightIcon: NightlightOutlinedIcon,
        en: 'Mainly clear',
        ar: 'صافية غالبًا',
    },
    {
        types: ['PARTLY_CLOUDY'],
        DayIcon: WbCloudyOutlinedIcon,
        NightIcon: NightsStayOutlinedIcon,
        en: 'Partly cloudy',
        ar: 'غائمة جزئيًا',
    },
    {
        types: ['MOSTLY_CLOUDY'],
        DayIcon: CloudOutlinedIcon,
        NightIcon: CloudOutlinedIcon,
        en: 'Mostly cloudy',
        ar: 'غائمة في الغالب',
    },
    {
        types: ['CLOUDY'],
        DayIcon: CloudOutlinedIcon,
        NightIcon: CloudOutlinedIcon,
        en: 'Cloudy',
        ar: 'غائمة',
    },
    {
        types: ['WINDY'],
        DayIcon: AirOutlinedIcon,
        NightIcon: AirOutlinedIcon,
        en: 'Windy',
        ar: 'رياح',
    },
    {
        types: ['WIND_AND_RAIN'],
        DayIcon: AirOutlinedIcon,
        NightIcon: AirOutlinedIcon,
        en: 'Wind and rain',
        ar: 'رياح وأمطار',
    },
    {
        types: ['LIGHT_RAIN_SHOWERS', 'CHANCE_OF_SHOWERS', 'SCATTERED_SHOWERS'],
        DayIcon: GrainOutlinedIcon,
        NightIcon: GrainOutlinedIcon,
        en: 'Light showers',
        ar: 'زخات خفيفة',
    },
    {
        types: ['RAIN_SHOWERS', 'HEAVY_RAIN_SHOWERS'],
        DayIcon: UmbrellaOutlinedIcon,
        NightIcon: UmbrellaOutlinedIcon,
        en: 'Rain showers',
        ar: 'زخات مطر',
    },
    {
        types: ['LIGHT_RAIN'],
        DayIcon: GrainOutlinedIcon,
        NightIcon: GrainOutlinedIcon,
        en: 'Light rain',
        ar: 'أمطار خفيفة',
    },
    {
        types: ['RAIN', 'LIGHT_TO_MODERATE_RAIN', 'MODERATE_TO_HEAVY_RAIN'],
        DayIcon: WaterDropOutlinedIcon,
        NightIcon: WaterDropOutlinedIcon,
        en: 'Rain',
        ar: 'أمطار',
    },
    {
        types: ['HEAVY_RAIN', 'RAIN_PERIODICALLY_HEAVY'],
        DayIcon: WaterDropOutlinedIcon,
        NightIcon: WaterDropOutlinedIcon,
        en: 'Heavy rain',
        ar: 'أمطار غزيرة',
    },
    {
        types: [
            'LIGHT_SNOW',
            'LIGHT_SNOW_SHOWERS',
            'CHANCE_OF_SNOW_SHOWERS',
            'SCATTERED_SNOW_SHOWERS',
        ],
        DayIcon: AcUnitOutlinedIcon,
        NightIcon: AcUnitOutlinedIcon,
        en: 'Light snow',
        ar: 'ثلوج خفيفة',
    },
    {
        types: [
            'SNOW',
            'SNOW_SHOWERS',
            'LIGHT_TO_MODERATE_SNOW',
            'MODERATE_TO_HEAVY_SNOW',
            'RAIN_AND_SNOW',
        ],
        DayIcon: AcUnitOutlinedIcon,
        NightIcon: AcUnitOutlinedIcon,
        en: 'Snow',
        ar: 'ثلوج',
    },
    {
        types: ['HEAVY_SNOW', 'HEAVY_SNOW_SHOWERS', 'SNOW_PERIODICALLY_HEAVY', 'BLOWING_SNOW'],
        DayIcon: AcUnitOutlinedIcon,
        NightIcon: AcUnitOutlinedIcon,
        en: 'Heavy snow',
        ar: 'ثلوج كثيفة',
    },
    {
        types: ['SNOWSTORM', 'HEAVY_SNOW_STORM'],
        DayIcon: AcUnitOutlinedIcon,
        NightIcon: AcUnitOutlinedIcon,
        en: 'Snowstorm',
        ar: 'عاصفة ثلجية',
    },
    {
        types: ['HAIL', 'HAIL_SHOWERS'],
        DayIcon: GrainOutlinedIcon,
        NightIcon: GrainOutlinedIcon,
        en: 'Hail',
        ar: 'بَرَد',
    },
    {
        types: [
            'THUNDERSTORM',
            'THUNDERSHOWER',
            'LIGHT_THUNDERSTORM_RAIN',
            'SCATTERED_THUNDERSTORMS',
            'HEAVY_THUNDERSTORM',
        ],
        DayIcon: ThunderstormOutlinedIcon,
        NightIcon: ThunderstormOutlinedIcon,
        en: 'Thunderstorm',
        ar: 'عواصف رعدية',
    },
]

const FALLBACK_CONDITION = {
    DayIcon: ThermostatOutlinedIcon,
    NightIcon: ThermostatOutlinedIcon,
    en: 'Current weather',
    ar: 'حالة الطقس',
}


const getWeatherCondition = (condition) => (
    WEATHER_CONDITIONS.find((entry) => entry.types.includes(condition)) || FALLBACK_CONDITION
)


const describeWeatherCondition = (condition, language) => {
    const matched = getWeatherCondition(condition)

    return language === 'ar' ? matched.ar : matched.en
}


function WeatherIcon({ condition, isDay, className }) {
    const matched = getWeatherCondition(condition)

    const Icon = isDay ? matched.DayIcon : matched.NightIcon

    return <Icon className={className} />
}


WeatherIcon.propTypes = {
    condition: PropTypes.string,
    isDay: PropTypes.bool,
    className: PropTypes.string,
}


export default WeatherIcon

export { describeWeatherCondition }
