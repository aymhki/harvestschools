import OptionsGrid from "../../modules/OptionsGrid.jsx";
import {Helmet} from "react-helmet-async";


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
      <>
          <Helmet>
              <title>Harvest International School | Admission Requirements</title>
              <meta name="description"
                    content="Learn more about the admission requirements in terms of documents, fees, minimum stage age, and more  for Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords"
                    content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Admission, Admission Process, Admission Requirements, Admissione Fees, مصاريف مدارس هارفست، متطلبات القبول، عملية القبول"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>
          <OptionsGrid title="Admission Requirements" titleInArabic={false} options={options}/>
      </>
  );
}

export default AdmissionRequirements;