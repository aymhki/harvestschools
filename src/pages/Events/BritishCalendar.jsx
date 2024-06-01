import '../../styles/Events.css'
import Table from "../../modules/Table.jsx";
import {Helmet} from "react-helmet";

function BritishCalendar() {
  return (
      <div className={"events-calendar-page"}>
          <Helmet>
              <title>Harvest International School | British Calendar</title>
              <meta name="description"
                    content="Learn more about the British academic year calendar at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords"
                    content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Events, Calendar, Academic Year, National, British, American, Kindergarten, سنة أكاديمية, تقويم, وطني, بريطاني, أمريكي, روضة, الروضة, سنة دراسية, مواعيد, امتحنات, اجازات"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>
          <container className={"extreme-padding-container"}>
              <h1>British Calendar</h1>

              <h2>
                  Online View
              </h2>

              <Table tableData={
                  [
                      ["Title", "Start Date", "End Date"],
                      ["1st School Day: Yr. 6, 7, 8, & 9", "September 1, 2021", "September 1, 2021"],
                      ["1st School Day: Yr. 3, 4, & 5", "September 2, 2021", "September 2, 2021"],
                      ["1st School Day: Yr. 1 & 2", "September 5, 2021", "September 5, 2021"],
                      ["6th of October Holiday", "October 7, 2021", "October 7, 2021"],
                      ["1st MidTerm Exams", "October 17, 2021", "October 20, 2021"],
                      ["Prophet's Mohammed Birthday", "October 21, 2021", "October 21, 2021"],
                      ["1st Term Exams", "December 5, 2021", "December 8, 2021"],
                      ["1st Term Break", "December 9, 2021", "December 12, 2021"],
                      ["1st Parent/Teacher Meeting", "December 12, 2021", "December 12, 2021"],
                      ["2nd Term Begins", "December 13, 2021", "December 13, 2021"],
                      ["2nd MidTerm Exams", "January 23, 2022", "January 27, 2022"],
                      ["Mid Year Vacation", "February 6, 2022", "February 19, 2022"],
                      ["2nd Term Exams", "March 27, 2022", "March 31, 2022"],
                      ["2nd Term Break", "April 1, 2022", "April 7, 2022"],
                      ["2nd Parent Teacher Meeting", "April 5, 2022", "April 5, 2022"],
                      ["3rd Term Begins", "April 10, 2022", "April 10, 2022"],
                      ["Easter Holiday", "April 25, 2022", "April 25, 2022"],
                      ["Labor Day & Eid El Fetr Vacation", "May 1, 2022", "May 7, 2022"],
                      ["3rd Term Exams", "June 12, 2022", "June 16, 2022"]
                  ]
              } numCols={3}/>

              <p>
                  Note: Some dates are subjected to change
              </p>

              <h2>
                  Offline View
              </h2>

              <div className={"download-calendar-button-wrapper"}  onClick={() => {
                  window.open("/assets/documents/Calendars/BritishCalendar.pdf", "_blank");
              }}>
                  <button className={"download-calendar-button"}>
                      Download Calendar
                  </button>
              </div>


          </container>
      </div>
  );
}

export default BritishCalendar;