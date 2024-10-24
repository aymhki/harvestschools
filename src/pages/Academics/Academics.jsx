import '../../styles/Academics.css';
import OptionsGrid from "../../modules/OptionsGrid.jsx";
import {Helmet} from "react-helmet";

function Academics() {

    const options = [
        {
            title: "National",
            image: "/assets/images/AcademicsPages/National1.png",
            description: "Information about the national curriculum.",
            link: "/academics/national",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "British",
            image: "/assets/images/AcademicsPages/British1.png",
            description: "Information about the British curriculum.",
            link: "/academics/british",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "American",
            image: "/assets/images/AcademicsPages/American1.png",
            description: "Information about the American curriculum.",
            link: "/academics/american",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "Partners",
            image: "/assets/images/AcademicsPages/Partners1.png",
            description: "Information about our partners.",
            link: "/academics/partners",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "Staff",
            image: "/assets/images/AcademicsPages/Staff1.png",
            description: "Information about our staff.",
            link: "/academics/staff",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "Facilities",
            image: "/assets/images/AcademicsPages/Facilities1.png",
            description: "Information about our facilities.",
            link: "/academics/facilities",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "Web Mail",
            image: "/assets/images/AcademicsPages/WebMail1.png",
            description: "Access your Harvest International School email.",
            link: "https://mail.harvestschools.com:2096/",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false,
            externalLink: true
        },
        {
            title: "Login",
            image: "/assets/images/AcademicsPages/Login1.png",
            description: "Web app login to view admin information.",
            link: "/login",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        }
    ];

  return (
    <div className="academics-page">
        <Helmet>
            <title>Harvest International School | Academics</title>
            <meta name="description"
                  content="Learn more about the American, National, and British academics, the curriculums, partners, staff, and facilities at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <OptionsGrid title="Academics" titleInArabic={false} options={options}/>
    </div>
  );
}

export default Academics;