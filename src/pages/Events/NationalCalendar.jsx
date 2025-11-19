import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function NationalCalendar() {

    const {t} = useTranslation()

  return (
    <div style={{textAlign: "center"}}>
        <Helmet>
            <title>Harvest International School | National Calendar</title>
            <meta name="description" content="Learn more about the National academic year calendar at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Events, Calendar, Academic Year, National, British, American, Kindergarten, سنة أكاديمية, تقويم, وطني, بريطاني, أمريكي, روضة, الروضة, سنة دراسية, مواعيد, امتحنات, اجازات"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

      <h1>
          {t("events-pages.national-calendar-page.title")}
      </h1>
        <p>
            {t("common.this-page-is-under-construction")}
        </p>
    </div>
  );
}

export default NationalCalendar;
