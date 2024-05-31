import '../../styles/Events.css'
import Table from "../../modules/Table.jsx";

function KgCalendar() {
  return (
      <div className={"events-calendar-page"}>
          <container className={"extreme-padding-container"}>
              <h1>KG Calendar</h1>
              <h2>
                  Online View
              </h2>

              <Table tableData={
                  [
                      ["Title", "Start Date", "End Date"],
                      ["1st School Day: Play School", "September 12, 2021", "September 12, 2021"],
                      ["1st School Day: FS2 & K", "September 14, 2021", "September 14, 2021"],
                      ["1st School Day: FS1 & Pre - K", "September 15, 2021", "September 15, 2021"],
                      ["Armed Forces Day", "October 6, 2021", "October 6, 2021"],
                      ["1st School Day: KG2", "October 10, 2021", "October 10, 2021"],
                      ["1st School Day: KG1", "October 12, 2021", "October 12, 2021"],
                      ["Prophet Mohammed's Birthday", "October 19, 2021", "October 19, 2021"],
                      ["Coptic Christmas Day", "January 7, 2022", "January 7, 2022"],
                      ["End of 1st Term", "January 13, 2022", "January 13, 2022"],
                      ["Revolution Day", "January 25, 2022", "January 25, 2022"],
                      ["Mid-Year Holiday", "February 5, 2022", "February 17, 2022"],
                      ["1st School Day For The Second Term", "February 19, 2022", "February 19, 2022"],
                      ["Easter Holiday", "April 25, 2022", "April 25, 2022"],
                      ["Sinai Liberation Day", "April 25, 2022", "April 25, 2022"],
                      ["Labor Day", "May 1, 2022", "May 1, 2022"],
                      ["Feast Holiday", "May 3, 2022", "May 3, 2022"],
                      ["End of 2nd Term", "June 9, 2022", "June 9, 2022"],
                      ["Revolution Day", "June 30, 2022", "June 30, 2022"]

                  ]
              } numCols={3}/>


              <p>
                  Kindly notice that any Official Holiday in the middle of the week will be shifted to Thursday
                  according to the Prime Minister’s Decision.
              </p>

              <h2>
                  Offline View
              </h2>

              <div className={"download-calendar-button-wrapper"} onClick={() => {
                  window.open("/assets/documents/Calendars/KGCalendar.pdf", "_blank");
              }}>
                  <button className={"download-calendar-button"}>
                      Download Calendar
                  </button>
              </div>

          </container>
      </div>
  );
}

export default KgCalendar;