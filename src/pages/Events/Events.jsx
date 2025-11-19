import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/Events.css';
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";


function Events() {
    const { t } = useTranslation();

    const options = [
        {
            title: t("events-pages.options-page.national-calendar-option"),
            image: "/assets/images/EventsPages/Calendar1.png",
            description: t("events-pages.options-page.national-calendar-option-description"),
            link: "/events/national-calendar",
            buttonText: t("common.select"),
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: t("events-pages.options-page.british-calendar-option"),
            image: "/assets/images/EventsPages/Calendar1.png",
            description: t("events-pages.options-page.british-calendar-option-description"),
            link: "/events/british-calendar",
            buttonText: t("common.select"),
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: t("events-pages.options-page.american-calendar-option"),
            image: "/assets/images/EventsPages/Calendar1.png",
            description: t("events-pages.options-page.american-calendar-option-description"),
            link: "/events/american-calendar",
            buttonText: t("common.select"),
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: t("events-pages.options-page.kg-calendar-option"),
            image: "/assets/images/EventsPages/Calendar1.png",
            description: t("events-pages.options-page.kg-calendar-option-description"),
            link: "/events/kg-calendar",
            buttonText: t("common.select"),
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: t("events-pages.options-page.booking-login-option"),
            image: "/assets/images/EventsPages/Booking1.png",
            description: t("events-pages.options-page.booking-login-option-description"),
            link: "/events/booking",
            buttonText: t("common.select"),
            titleInArabic: false,
            descriptionInArabic: false
        }
    ];

  return (
    <div className={"events-page"}>
        <Helmet>
            <title>Harvest International School | Events | Calendar</title>
            <meta name="description" content="Learn more about the Academic year calendars and Events at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Events, Calendar, Academic Year, National, British, American, Kindergarten, سنة أكاديمية, تقويم, وطني, بريطاني, أمريكي, روضة, الروضة, سنة دراسية, مواعيد, امتحنات, اجازات"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <OptionsGrid title={t("events-pages.options-page.title")} titleInArabic={false} options={options}/>
    </div>
  );
}

export default Events;