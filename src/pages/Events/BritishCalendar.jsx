import {useTranslation} from "react-i18next";
import CalendarTable from "../../modules/CalendarTable.jsx";

function BritishCalendar() {
    const {t} = useTranslation(['events-pages'])

    return (
        <>
            <title>Harvest International School | British School Calendar</title>
            <meta name="description" content="Learn more about the British academic year calendar at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Events, Calendar, Academic Year, National, British, American, Kindergarten, سنة أكاديمية, تقويم, وطني, بريطاني, أمريكي, روضة, الروضة, سنة دراسية, مواعيد, امتحنات, اجازات"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>

            <CalendarTable calendarId={"british"}
                           title={t("events-pages.british-calendar-page.title")}
                           className={"events-calendar-page"}
            />
        </>
    );
}

export default BritishCalendar;
