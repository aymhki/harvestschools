import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";
import '../../styles/Admission.css';
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

function OutsideEgyptRequirements() {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;

    return (
        <div className="admission-outside-egypt-page">
            <Helmet>
                <title>Harvest International School | Admission Requirements Outside Egypt</title>
                <meta name="description" content="Learn more about what is required from parents and students when applying to transfer from a school outside of Egypt or applying to schools for the first time from outside of Egypt"/>
                <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Admission, Admission Process, Admission Requirements, Admissione Fees, مصاريف مدارس هارفست، متطلبات القبول، عملية القبول"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <ParallaxScrollSection
                backgroundImage={'/assets/images/AdmissionPages/OutsideEgyptRequirementsHeaderBackground.jpg'}
                title={t('admission-pages.admission-requirements-page.common.admission-requirements-note')}
                titleInArabic={false}
                darken={true}
                divElements={[(
                    <div className="admission-requirements-note" key={1}>
                        <ul className={"admission-note-list"} lang={currentLang}>
                            {t('admission-pages.admission-requirements-page.outside-egypt-page.admission-requirements-note-list', { returnObjects: true }).map((item, index) => (
                                <li key={index}><p>{item}</p></li>
                            ))}
                        </ul>
                    </div>
                )]}
            />

            <div className="extreme-padding-container">
                <h3>{t('admission-pages.admission-requirements-page.outside-egypt-page.from-kg-1-requirements.from-kg-1-title')}</h3>
                <div className="admission-requirements-list-container">
                    <ul className={"admission-requirements-list"} lang={currentLang}>
                        {t('admission-pages.admission-requirements-page.outside-egypt-page.from-kg-1-requirements.from-kg-1-requirements-list', { returnObjects: true }).map((item, index) => (
                            <li key={index}><p>{item}</p></li>
                        ))}
                    </ul>
                </div>

                <h3>{t('admission-pages.admission-requirements-page.outside-egypt-page.from-kg-2-to-junior-6-requirements.from-kg-2-to-junior-6-title')}</h3>
                <div className="admission-requirements-list-container">
                    <ul className={"admission-requirements-list"} lang={currentLang}>
                        {t('admission-pages.admission-requirements-page.outside-egypt-page.from-kg-2-to-junior-6-requirements.from-kg-2-to-junior-6-requirements-list', { returnObjects: true }).map((item, index) => (
                            <li key={index}><p>{item}</p></li>
                        ))}
                    </ul>
                </div>

                <h3>{t('admission-pages.admission-requirements-page.outside-egypt-page.from-preparatory-1-to-preparatory-3-requirements.from-preparatory-1-to-preparatory-3-title')}</h3>
                <div className="admission-requirements-list-container">
                    <ul className={"admission-requirements-list"} lang={currentLang}>
                        {t('admission-pages.admission-requirements-page.outside-egypt-page.from-preparatory-1-to-preparatory-3-requirements.from-preparatory-1-to-preparatory-3-requirements-list', { returnObjects: true }).map((item, index) => (
                            <li key={index}><p>{item}</p></li>
                        ))}
                    </ul>
                </div>

                <h3>{t('admission-pages.admission-requirements-page.outside-egypt-page.from-senior-1-to-senior-3-requirements.from-senior-1-to-senior-3-title')}</h3>
                <div className="admission-requirements-list-container">
                    <ul className={"admission-requirements-list"} lang={currentLang}>
                        {t('admission-pages.admission-requirements-page.outside-egypt-page.from-senior-1-to-senior-3-requirements.from-senior-1-to-senior-3-requirements-list', { returnObjects: true }).map((item, index) => (
                            <li key={index}><p>{item}</p></li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default OutsideEgyptRequirements;