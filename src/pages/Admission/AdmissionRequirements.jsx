import OptionsGrid from "../../modules/OptionsGrid.jsx";

function AdmissionRequirements() {

    const options = [
        {
            title: "Inside Egypt",
            image: "/assets/images/AdmissionPages/Egypt1.png",
            description: "Information about admission requirements for students inside Egypt.",
            link: "/admission/inside-egypt-requirements",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "Outside Egypt",
            image: "/assets/images/AdmissionPages/Globe1.png",
            description: "Information about admission requirements for students outside Egypt.",
            link: "/admission/outside-egypt-requirements",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "Outside Egypt - Foreigners",
            image: "/assets/images/AdmissionPages/Foreigner1.png",
            description: "Information about admission requirements for foreign students outside Egypt.",
            link: "/admission/outside-egypt-requirements-foreigners",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        }
    ];

  return (
    <OptionsGrid title="Admission Requirements" titleInArabic={false} options={options}/>
  );
}

export default AdmissionRequirements;