import '../../styles/Admission.css';
import OptionsGrid from "../../modules/OptionsGrid.jsx";

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
        }
    ]

    return (
        <div className="admission-page">
            <OptionsGrid title="Admission" titleInArabic={false} options={options}/>
        </div>
    )
}

export default Admission;