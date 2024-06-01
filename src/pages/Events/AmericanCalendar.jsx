import '../../styles/Events.css'
import Table from "../../modules/Table.jsx";
import {Helmet} from "react-helmet";

function AmericanCalendar() {
  return (
    <div className={"events-calendar-page"}>
        <Helmet>
            <title>Harvest International School | American Calendar</title>
            <meta name="description"
                  content="Learn more about the American academic year calendar at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Events, Calendar, Academic Year, National, British, American, Kindergarten, سنة أكاديمية, تقويم, وطني, بريطاني, أمريكي, روضة, الروضة, سنة دراسية, مواعيد, امتحنات, اجازات"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <container className={"extreme-padding-container"}>
            <h1>American Calendar</h1>
            <h2>
                Online View
            </h2>
            <Table tableData={
                [
                    ["Title", "Start Date", "End Date"],
                    ["1st School Day: Gr. 1, 2, and 3", "September 5, 2021", "September 5, 2021"],
                    ["1st School Day: Gr. 4, 5, and 6", "September 6, 2021", "September 6, 2021"],
                    ["1st School Day: Gr. 7, 8, 9, and 10", "September 7, 2021", "September 7, 2021"],
                    ["Armed Forces Day", "October 6, 2021", "October 6, 2021"],
                    ["Prophet Muhammed's Birthday", "October 19, 2021", "October 19, 2021"],
                    ["Halloween Day", "October 28, 2021", "October 28, 2021"],
                    ["1st Quarter Exams", "November 14, 2021", "November 18, 2021"],
                    ["Parents Meeting", "November 25, 2021", "November 25, 2021"],
                    ["Christmas Day", "December 23, 2021", "December 23, 2021"],
                    ["Coptic Christmas Day", "January 7, 2022", "January 7, 2022"],
                    ["Revolution Day", "January 25, 2022", "January 25, 2022"],
                    ["2nd Quarter Exams", "January 30, 2022", "February 3, 2022"],
                    ["Mid-Year Vacation", "February 5, 2022", "February 19, 2022"],
                    ["Beginning of 3rd Quarter", "February 20, 2022", "February 20, 2022"],
                    ["Mother's Day", "March 21, 2022", "March 21, 2022"],
                    ["3rd Quarter Exams", "April 17, 2022", "April 21, 2022"],
                    ["Easter Vacation", "April 25, 2022", "April 25, 2022"],
                    ["Labor Day", "May 1, 2022", "May 1, 2022"],
                    ["Feast Vaccation", "May 3, 2022", "May 5, 2022"],
                    ["Beginning of 4th Quarter", "May 8, 2022", "May 8, 2022"],
                    ["Parents Meeting", "May 12, 2022", "May 12, 2022"],
                    ["4th Quarter Exams", "June 19, 2022", "June 22, 2022"]
                ]
            } numCols={3}/>

            <p>
                Kindly notice that any Official Holiday in the middle of the week will be shifted to Thursday according to the Prime Minister’s Decision.
            </p>

            <h2>
                Offline View
            </h2>

            <div className={"download-calendar-button-wrapper"} onClick={() => {
                window.open("/assets/documents/Calendars/AmericanCalendar.pdf", "_blank");
            }}>
                <button className={"download-calendar-button"}>
                    Download Calendar
                </button>
            </div>

        </container>
    </div>
  );
}

export default AmericanCalendar;