import '../../styles/Admission.css';
import OptionsGrid from "../../modules/OptionsGrid.jsx";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function Admission() {

    const {t} = useTranslation();

    const options = [
        {
            title: t("admission-pages.options-page.admission-process-option"),
            image: "/assets/images/AdmissionPages/AdmissionProcess1.png",
            description: t("admission-pages.options-page.admission-process-option-description"),
            link: "/admission/admission-process",
            buttonText: t("common.learn-more"),
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: t("admission-pages.options-page.admission-requirements-option"),
            image: "/assets/images/AdmissionPages/AdmissionChecklist2.png",
            description: t("admission-pages.options-page.admission-requirements-option-description"),
            link: "/admission/admission-requirements",
            buttonText: t("common.learn-more"),
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: t("admission-pages.options-page.admission-fees-option"),
            image: "/assets/images/AdmissionPages/AdmissionFees1.png",
            description: t("admission-pages.options-page.admission-fees-option-description"),
            link: "/admission/admission-fees",
            buttonText: t("common.learn-more"),
            titleInArabic: false,
            descriptionInArabic: false
        }
    ]

    return (
        <div className="admission-page">
            <Helmet>
                <title>Harvest International School | Admission</title>
                <meta name="description" content="Learn more about the admission process, the admssion requirements, and the admission fees for Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Admission, Admission Process, Admission Requirements, Admissione Fees, مصاريف مدارس هارفست، متطلبات القبول، عملية القبول"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <OptionsGrid title={t("admission-pages.options-page.admission-title")} titleInArabic={false} options={options}/>
        </div>
    )
}

export default Admission;