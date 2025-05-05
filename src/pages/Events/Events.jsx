import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/Events.css';
import {Helmet} from "react-helmet";

function Events() {

    const options = [
        {
            title: "National Calendar",
            image: "/assets/images/EventsPages/Calendar1.png",
            description: "Detailed timeline of the National academic year.",
            link: "/events/national-calendar",
            buttonText: "Select",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "British Calendar",
            image: "/assets/images/EventsPages/Calendar1.png",
            description: "Detailed timeline of the British academic year.",
            link: "/events/british-calendar",
            buttonText: "Select",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "American Calendar",
            image: "/assets/images/EventsPages/Calendar1.png",
            description: "Detailed timeline of the American academic year.",
            link: "/events/american-calendar",
            buttonText: "Select",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "KG Calendar",
            image: "/assets/images/EventsPages/Calendar1.png",
            description: "Detailed timeline of the Kindergarten academic year.",
            link: "/events/kg-calendar",
            buttonText: "Select",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "Booking",
            image: "/assets/images/EventsPages/Booking1.png",
            description: "Access booking info, extras, and media.",
            link: "/events/booking",
            buttonText: "Select",
            titleInArabic: false,
            descriptionInArabic: false
        }
    ];

  return (
    <div className={"events-page"}>
        <Helmet>
            <title>Harvest International School | Events | Calendar</title>
            <meta name="description"
                  content="Learn more about the Academic year calendars and Events at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Events, Calendar, Academic Year, National, British, American, Kindergarten, سنة أكاديمية, تقويم, وطني, بريطاني, أمريكي, روضة, الروضة, سنة دراسية, مواعيد, امتحنات, اجازات"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <OptionsGrid title="Events" titleInArabic={false} options={options}/>
    </div>
  );
}

export default Events;