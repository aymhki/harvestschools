import '../../styles/Academics.css';
import {Helmet} from "react-helmet-async";
import { useTranslation } from 'react-i18next';
import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";

function PreKindergartenAcademics() {
    const { t } = useTranslation();

    return (
        <div className={"kindergarten-academics-page"}>
            <Helmet>
                <title>Harvest International School | Pre-K Academics</title>
                <meta name="description" content="Learn more about the Kindergarten academics at Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Kindergarten, Academics, American, National, British, Partners, Staff, Facilities,  مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق، رياض الأطفال، رياض الاطفال"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <ParallaxScrollSection
                backgroundImage={"../../assets/images/AcademicsPages/Pre-KAcademicsPageHeader1.jpg"}
                darken={true}
                image={"../../assets/images/AcademicsPages/OpeningQuote.png"}
                imageAlt={"Academics Page Header Opening Quote"}
            />

            <div className={"standard-padding-container"}>
                <p>
                    {t("academics-pages.kindergarten.pre-kindergarten-intro-paragraph")}
                </p>
                <p>
                    {t("academics-pages.kindergarten.pre-kindergarten-approach-paragraph")}
                </p>
            </div>

            <ParallaxScrollSection backgroundImage={"../../assets/images/AcademicsPages/Pre-KAcademicsPageMiddle1.jpg"}/>

            <div className={"standard-padding-container"}>
                <p>
                    {t("academics-pages.kindergarten.pre-kindergarten-team-paragraph")}
                </p>
                <p>
                    {t("academics-pages.kindergarten.pre-kindergarten-outro-paragraph")}
                </p>
            </div>

            <ParallaxScrollSection
                backgroundImage={"../../assets/images/AcademicsPages/Pre-KAcademicsPageFooter1.jpg"}
                darken={true}
                text={t("academics-pages.kindergarten.quote-by-ms-reham-sardina-head-of-kindergarten-department")}
                image={"../../assets/images/AcademicsPages/ClosingQuote.png"}
                imageAlt={"Academics Page Footer Closing Quote"}
            />

        </div>
    );
}

export default PreKindergartenAcademics;