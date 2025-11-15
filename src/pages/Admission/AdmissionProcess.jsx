import '../../styles/Admission.css';
import {useNavigate} from "react-router-dom";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";


function AdmissionProcess() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

  return (
    <div className="admission-process-page">
        <Helmet>
            <title>Harvest International School | Admission Process</title>
            <meta name="description" content="Learn more about the admission process in terms of the application process, the interview, and the follow-up process for Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Admission, Admission Process, Admission Requirements, Admissione Fees, مصاريف مدارس هارفست، متطلبات القبول، عملية القبول"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <div className="extreme-padding-container">
            <img
                src={
                    i18n.language === 'ar' ? '/assets/images/AdmissionPages/harvest-schools-admission-process-diagram-ar.png' :
                                             '/assets/images/AdmissionPages/harvest-schools-admission-process-diagram-en.png'
                }
                className={"admission-process-image"} alt="Admission Process"
            />

            <div className="admission-process-steps">
                <div className="admission-process-step">
                    <h2>
                        {t("admission-pages.admission-process-page.fill-an-application")}
                    </h2>

                    <p>
                        {t("admission-pages.admission-process-page.fill-an-application-description")}
                    </p>

                    <div className={"admission-process-button-wrapper"}>

                        <button className="admission-process-button" onClick={() => window.open('https://schooleverywhere-harvest.com/schooleverywhere/management/onlineadmission/applyonline/onlineadmission.php', '_blank')}>
                            {t("nav.apply-now")}
                        </button>

                    </div>
                </div>
                <div className="admission-process-step">
                    <h2>
                        {t("admission-pages.admission-process-page.attend-your-interview")}
                    </h2>
                    <p>
                        {t("admission-pages.admission-process-page.attend-your-interview-description")}
                    </p>
                </div>
                <div className="admission-process-step">
                    <h2>
                        {t("admission-pages.admission-process-page.follow-up")}
                    </h2>
                    <p>
                        {t("admission-pages.admission-process-page.follow-up-description")}
                    </p>

                    <div className={"admission-process-button-wrapper"}>
                        <button onClick={() => navigate('/admission/admission-fees')} className="admission-process-button">
                            {t("admission-pages.admission-process-page.admission-fees-btn")}
                        </button>

                        <button onClick={() => navigate('/admission/admission-requirements')} className="admission-process-button">
                            {t("admission-pages.admission-process-page.required-documents-btn")}
                        </button>
                    </div>
                </div>
            </div>

        </div>


    </div>
  );
}

export default AdmissionProcess;