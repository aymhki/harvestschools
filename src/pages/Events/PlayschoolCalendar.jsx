import {useTranslation} from "react-i18next";
import CalendarTable from "../../modules/CalendarTable.jsx";

function PlayschoolCalendar() {
    const {t} = useTranslation(['events-pages'])

    return (
        <>
            <title>Harvest International School | Playschool Calendar</title>
            <meta name="description" content="Learn more about the Playschool academic year calendar at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Events, Calendar, Academic Year, Playschool, Pre-K, الحضانة, سنة أكاديمية, تقويم, سنة دراسية, مواعيد, امتحنات, اجازات"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>

            <CalendarTable calendarId={"playschool"} title={t("events-pages.playschool-calendar-page.title")} className={"events-calendar-page"}
            />
        </>
    );
}

export default PlayschoolCalendar;