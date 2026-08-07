import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";
import CalendarTable from "../../modules/CalendarTable.jsx";

function BritishKGCalendar() {
    const {t} = useTranslation(['events-pages'])

    return (
        <>
            <Helmet>
                <title>Harvest International School | British KG School Calendar</title>
                <meta name="description" content="Learn more about the British Kindergarten academic year calendar at Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Events, Calendar, Academic Year, National, British, American, Kindergarten, سنة أكاديمية, تقويم, وطني, بريطاني, أمريكي, روضة, الروضة, سنة دراسية, مواعيد, امتحنات, اجازات"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <CalendarTable calendarId={"british-kg"}
                           title={t("events-pages.kg-calendars-pages.british-kg-calendar.title")}
                           className={"events-calendar-page"}
            />
        </>
    );
}

export default BritishKGCalendar;
