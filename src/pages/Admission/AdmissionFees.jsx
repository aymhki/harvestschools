import '../../styles/Admission.css'
import {useTranslation} from "react-i18next";
import TuitionFeesTables from "../../modules/TuitionFeesTables.jsx";

const showTuitionFees = true;

function AdmissionFees() {

    const { t } = useTranslation(['admission-pages', 'common']);

  return (
    <div className={"admission-fees-page"}>

        <title>Harvest International School | Tuition Fees</title>
        <meta name="description" content="Learn more about the breakdown of the tuition fees for each grade at each division of Harvest International School in Borg El Arab, Egypt."/>
        <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Admission, Admission Process, Admission Requirements, Admissione Fees, مصاريف مدارس هارفست، متطلبات القبول، عملية القبول"/>
        <meta name="author" content="Harvest International School"/>
        <meta name="robots" content="index, follow"/>
        <meta name="googlebot" content="index, follow"/>

        <div className={"extreme-padding-container"}>
            <h1>
                {t("admission-pages.options-page.admission-fees-option")}
            </h1>

            {showTuitionFees ? (
                <TuitionFeesTables/>
            ) : (
                <p>
                    {t('common.this-page-is-under-construction', {ns: 'common'})}
                </p>
            )}
        </div>
    </div>
  );
}

export default AdmissionFees;
