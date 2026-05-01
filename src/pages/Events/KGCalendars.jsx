import '../../styles/Events.css'
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";
import OptionsGrid from "../../modules/OptionsGrid.jsx";


function KGCalendars() {
    const { t } = useTranslation();

    const options = [
        {
            title: t("events-pages.kg-calendars-pages.options-page.national-kg-calendar-option"),
            image: "/assets/images/EventsPages/Calendar1.png",
            description: t("events-pages.kg-calendars-pages.options-page.national-kg-calendar-option-description"),
            link: "/events/national-kg-calendar",
            buttonText: t("common.select"),
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: t("events-pages.kg-calendars-pages.options-page.british-kg-calendar-option"),
            image: "/assets/images/EventsPages/Calendar1.png",
            description: t("events-pages.kg-calendars-pages.options-page.british-kg-calendar-option-description"),
            link: "/events/british-kg-calendar",
            buttonText: t("common.select"),
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: t("events-pages.kg-calendars-pages.options-page.american-kg-calendar-option"),
            image: "/assets/images/EventsPages/Calendar1.png",
            description: t("events-pages.kg-calendars-pages.options-page.american-kg-calendar-option-description"),
            link: "/events/american-kg-calendar",
            buttonText: t("common.select"),
            titleInArabic: false,
            descriptionInArabic: false
        },
    ]


    return (
      <div className={"events-page"}>
          <Helmet>
              <title>Harvest International School | KG Calendars</title>
              <meta name="description" content="Learn more about the KG academic year calendars at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Events, Calendar, Academic Year, National, British, American, Kindergarten, سنة أكاديمية, تقويم, وطني, بريطاني, أمريكي, روضة, الروضة, سنة دراسية, مواعيد, امتحنات, اجازات"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <OptionsGrid title={t("events-pages.kg-calendars-pages.options-page.title")} titleInArabic={false} options={options}/>
      </div>
  );
}

export default KGCalendars;