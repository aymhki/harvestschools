import OptionsGrid from "../../modules/OptionsGrid.jsx";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";


function AdmissionRequirements() {

    const { t } = useTranslation();

    const options = [
        {
            title: t("admission-pages.admission-requirements-page.options-page.inside-egypt-option"),
            image: "/assets/images/AdmissionPages/Egypt1.png",
            description: t("admission-pages.admission-requirements-page.options-page.inside-egypt-option-description"),
            link: "/admission/inside-egypt-requirements",
            buttonText: t("common.learn-more"),
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: t("admission-pages.admission-requirements-page.options-page.outside-egypt-option"),
            image: "/assets/images/AdmissionPages/Globe1.png",
            description: t("admission-pages.admission-requirements-page.options-page.outside-egypt-option-description"),
            link: "/admission/outside-egypt-requirements",
            buttonText: t("common.learn-more"),
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: t("admission-pages.admission-requirements-page.options-page.outside-egypt-foreigners-option"),
            image: "/assets/images/AdmissionPages/Foreigner1.png",
            description: t("admission-pages.admission-requirements-page.options-page.outside-egypt-foreigners-option-description"),
            link: "/admission/outside-egypt-requirements-foreigners",
            buttonText: t("common.learn-more"),
            titleInArabic: false,
            descriptionInArabic: false
        }
    ];

  return (
      <>
          <Helmet>
              <title>Harvest International School | Admission Requirements</title>
              <meta name="description" content="Learn more about the admission requirements in terms of documents, fees, minimum stage age, and more  for Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Admission, Admission Process, Admission Requirements, Admissione Fees, مصاريف مدارس هارفست، متطلبات القبول، عملية القبول"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <OptionsGrid title={t("admission-pages.admission-requirements-page.options-page.admission-requirements-title")} titleInArabic={false} options={options}/>
      </>
  );
}

export default AdmissionRequirements;