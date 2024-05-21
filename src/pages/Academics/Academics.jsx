import '../../styles/Academics.css';
import OptionsGrid from "../../modules/OptionsGrid.jsx";

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
        // {
        //     title: "Facilities",
        //     image: "/assets/images/AcademicsPages/Facilities1.png",
        //     description: "Information about our facilities.",
        //     link: "/gallery/",
        //     buttonText: "Learn More",
        //     titleInArabic: false,
        //     descriptionInArabic: false
        // }
    ];

  return (
    <div className="academics-page">
        <OptionsGrid title="Academics" titleInArabic={false} options={options}/>
    </div>
  );
}

export default Academics;