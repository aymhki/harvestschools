import '../../styles/Admission.css';
import OptionsGrid from "../../modules/OptionsGrid.jsx";
import {Helmet} from "react-helmet";

function Admission() {

    const options = [
        {
            title: "Admission Process",
            image: "/assets/images/AdmissionPages/AdmissionProcess1.png",
            description: "How to apply? Where to apply? What should you do after you apply?",
            link: "/admission/admission-process",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "Admission Requirements",
            image: "/assets/images/AdmissionPages/AdmissionChecklist2.png",
            description: "What are the required documents? What are the age requirements? How much are the fees?",
            link: "/admission/admission-requirements",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "Admission Fees",
            image: "/assets/images/AdmissionPages/AdmissionFees1.png",
            description: "How much are the fees for each grade? What are the payment methods?",
            link: "/admission/admission-fees",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        }
    ]

    return (
        <div className="admission-page">
            <Helmet>
                <title>Harvest International School | Admission</title>
                <meta name="description"
                      content="Learn more about the admission process, the admssion requirements, and the admission fees for Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords"
                      content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Admission, Admission Process, Admission Requirements, Admissione Fees, مصاريف مدارس هارفست، متطلبات القبول، عملية القبول"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <OptionsGrid title="Admission" titleInArabic={false} options={options}/>
        </div>
    )
}

export default Admission;