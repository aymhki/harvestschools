import '../../styles/Events.css'
import Table from "../../modules/Table.jsx";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";


function BritishCalendar() {
    const {t, i18n} = useTranslation()

    const calendarTableData = t("events-pages.british-calendar-page.calendar", { returnObjects: true }) || [];
    const tableRows = Array.isArray(calendarTableData) ? calendarTableData.map(member => [member.title, member['start-date'], member['end-date']]) : [];
    const finalTableData = [...tableRows];
    const dateFormatter = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Africa/Cairo'
    })

    for (let i = 1; i < finalTableData.length; i++) {
        const startDate = new Date(finalTableData[i][1]);
        const endDate = new Date(finalTableData[i][2]);
        finalTableData[i][1] = dateFormatter.format(startDate);
        finalTableData[i][2] = dateFormatter.format(endDate);
    }


  return (
      <div className={"events-calendar-page"}>
          <Helmet>
              <title>Harvest International School | British Calendar</title>
              <meta name="description" content="Learn more about the British academic year calendar at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Events, Calendar, Academic Year, National, British, American, Kindergarten, سنة أكاديمية, تقويم, وطني, بريطاني, أمريكي, روضة, الروضة, سنة دراسية, مواعيد, امتحنات, اجازات"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <div className={"extreme-padding-container"}>
              <h1>
                  {t("events-pages.british-calendar-page.title")}
              </h1>

              <Table tableData={finalTableData} numCols={3}/>

              <p>
                    {t("events-pages.common.subjected-to-change-notice")}
              </p>

              <div className={"download-calendar-button-wrapper"}  onClick={() => {
                  window.open("/assets/documents/Calendars/BritishCalendar.pdf", "_blank");
              }}>
                  <button className={"download-calendar-button"}>
                        {t("events-pages.common.download-calendar-btn")}
                  </button>
              </div>

          </div>
      </div>
  );
}

export default BritishCalendar;