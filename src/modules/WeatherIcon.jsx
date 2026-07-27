import PropTypes from 'prop-types'
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined'
import NightlightOutlinedIcon from '@mui/icons-material/NightlightOutlined'
import CloudQueueOutlinedIcon from '@mui/icons-material/CloudQueueOutlined'
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined'
import FilterDramaOutlinedIcon from '@mui/icons-material/FilterDramaOutlined'
import GrainOutlinedIcon from '@mui/icons-material/GrainOutlined'
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined'
import UmbrellaOutlinedIcon from '@mui/icons-material/UmbrellaOutlined'
import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined'
import ThunderstormOutlinedIcon from '@mui/icons-material/ThunderstormOutlined'
import ThermostatOutlinedIcon from '@mui/icons-material/ThermostatOutlined'


const WEATHER_CONDITIONS = [
    { codes: [0], DayIcon: WbSunnyOutlinedIcon, NightIcon: NightlightOutlinedIcon, en: 'Clear sky', ar: 'صافية' },
    { codes: [1, 2], DayIcon: CloudQueueOutlinedIcon, NightIcon: CloudQueueOutlinedIcon, en: 'Partly cloudy', ar: 'غائمة جزئيًا' },
    { codes: [3], DayIcon: CloudOutlinedIcon, NightIcon: CloudOutlinedIcon, en: 'Overcast', ar: 'غائمة' },
    { codes: [45, 48], DayIcon: FilterDramaOutlinedIcon, NightIcon: FilterDramaOutlinedIcon, en: 'Fog', ar: 'ضباب' },
    { codes: [51, 53, 55, 56, 57], DayIcon: GrainOutlinedIcon, NightIcon: GrainOutlinedIcon, en: 'Drizzle', ar: 'رذاذ' },
    { codes: [61, 63, 65, 66, 67], DayIcon: WaterDropOutlinedIcon, NightIcon: WaterDropOutlinedIcon, en: 'Rain', ar: 'أمطار' },
    { codes: [80, 81, 82], DayIcon: UmbrellaOutlinedIcon, NightIcon: UmbrellaOutlinedIcon, en: 'Rain showers', ar: 'زخات مطر' },
    { codes: [71, 73, 75, 77, 85, 86], DayIcon: AcUnitOutlinedIcon, NightIcon: AcUnitOutlinedIcon, en: 'Snow', ar: 'ثلوج' },
    { codes: [95, 96, 99], DayIcon: ThunderstormOutlinedIcon, NightIcon: ThunderstormOutlinedIcon, en: 'Thunderstorm', ar: 'عواصف رعدية' },
]

const FALLBACK_CONDITION = {
    DayIcon: ThermostatOutlinedIcon,
    NightIcon: ThermostatOutlinedIcon,
    en: 'Current weather',
    ar: 'حالة الطقس',
}


const getWeatherCondition = (weatherCode) => (
    WEATHER_CONDITIONS.find((condition) => condition.codes.includes(weatherCode)) || FALLBACK_CONDITION
)


const describeWeatherCode = (weatherCode, language) => {
    const condition = getWeatherCondition(weatherCode)

    return language === 'ar' ? condition.ar : condition.en
}


function WeatherIcon({ weatherCode, isDay, className }) {
    const condition = getWeatherCondition(weatherCode)

    const Icon = isDay ? condition.DayIcon : condition.NightIcon

    return <Icon className={className} />
}


WeatherIcon.propTypes = {
    weatherCode: PropTypes.number.isRequired,
    isDay: PropTypes.bool,
    className: PropTypes.string,
}


export default WeatherIcon

export { describeWeatherCode }
