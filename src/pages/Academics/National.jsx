import '../../styles/Academics.css';
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";
import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";


function National() {
    const { t } = useTranslation();

  return (
    <div className="national-academics-page">
        <Helmet>
            <title>Harvest International School | National Academics</title>
            <meta name="description" content="Learn more about the National academics, the curriculum, and facilities for the National Division at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <ParallaxScrollSection
            backgroundImage={"../../assets/images/AcademicsPages/NationalAcademicsPageHeader1.jpg"}
            darken={true}
            image={"../../assets/images/AcademicsPages/OpeningQuote.png"}
           imageAlt={"Academics Page Header Opening Quote"}
        />

        <div className={"standard-padding-container"}>
            <p>{t("academics-pages.national.national-school-intro-paragraph")}</p>
            <p>{t("academics-pages.national.national-school-commitment-paragraph")}</p>
            <p>{t("academics-pages.national.national-school-high-quality-paragraph")}</p>
        </div>

        <ParallaxScrollSection backgroundImage={"../../assets/images/AcademicsPages/NationalAcademicsPageMiddleVisual1.jpg"}/>

        <div className={"standard-padding-container"}>
            <p>{t("academics-pages.national.national-school-beyond-classroom-paragraph")}</p>
            <p>{t("academics-pages.national.national-school-outro-paragraph")}</p>
        </div>

        <ParallaxScrollSection
            backgroundImage={"../../assets/images/AcademicsPages/NationalAcademicsPageFooter1.jpg"}
            text={t("academics-pages.national.quote-by-ms-aya-abdelgawad-national-school-deputy")}
            darken={true}
            image={"../../assets/images/AcademicsPages/ClosingQuote.png"}
            imageAlt={"Academics Page Footer Closing Quote"}
        />

    </div>
);
}

export default National;