import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";
import '../../styles/Admission.css'
import {useTranslation} from "react-i18next";
import {servePublicAsset} from "../../services/General/GeneralServices.jsx"
import AdmissionRequirementsList from "../../modules/AdmissionRequirementsList.jsx";


function AdmissionRequirements() {

    const { t } = useTranslation(['admission-pages']);

  return (
      <div className="admission-requirements-page">
          <title>Harvest International School | Admission Requirements</title>
          <meta name="description" content="Learn more about the admission requirements in terms of documents, fees, minimum stage age, and more  for Harvest International School in Borg El Arab, Egypt."/>
          <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Admission, Admission Process, Admission Requirements, Admissione Fees, مصاريف مدارس هارفست، متطلبات القبول، عملية القبول"/>
          <meta name="author" content="Harvest International School"/>
          <meta name="robots" content="index, follow"/>
          <meta name="googlebot" content="index, follow"/>

          <ParallaxScrollSection
              backgroundImage={servePublicAsset('/images/AdmissionPages/InsideEgyptRequirementsHeaderBackground.jpg')}
              title={t('admission-pages.admission-requirements-page.options-page.admission-requirements-title')}
              titleInArabic={false}
              darken={true}
          />

          <AdmissionRequirementsList/>
      </div>
  );
}

export default AdmissionRequirements;
