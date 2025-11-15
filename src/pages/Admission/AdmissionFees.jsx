import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function AdmissionFees() {

    const { t } = useTranslation();

  return (
    <div style={{textAlign: "center"}}>

        <Helmet>
            <title>Harvest International School | Admission Fees</title>
            <meta name="description" content="Learn more about the breakdown of the admission fees for each grade at each division of Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Admission, Admission Process, Admission Requirements, Admissione Fees, مصاريف مدارس هارفست، متطلبات القبول، عملية القبول"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

      <h1>
          {t("admission-pages.options-page.admission-fees-option")}
      </h1>

        <p>
            {t("common.this-page-is-under-construction")}
        </p>
    </div>
  );
}

export default AdmissionFees;