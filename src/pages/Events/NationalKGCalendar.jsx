import {useTranslation} from "react-i18next";
import CalendarTable from "../../modules/CalendarTable.jsx";

function NationalKGCalendar() {
    const {t} = useTranslation(['events-pages'])

    return (
        <>
            <title>Harvest International School | National KG School Calendar</title>
            <meta name="description" content="Learn more about the National Kindergarten academic year calendar at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Events, Calendar, Academic Year, National, British, American, Kindergarten, سنة أكاديمية, تقويم, وطني, بريطاني, أمريكي, روضة, الروضة, سنة دراسية, مواعيد, امتحنات, اجازات"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>

            <CalendarTable calendarId={"national-kg"}
                           title={t("events-pages.kg-calendars-pages.national-kg-calendar.title")}
                           className={"events-calendar-page"}
            />
        </>
    );
}

export default NationalKGCalendar;
