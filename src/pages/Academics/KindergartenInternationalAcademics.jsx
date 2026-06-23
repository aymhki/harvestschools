import '../../styles/Academics.css';
import {Helmet} from "react-helmet-async";
import { useTranslation } from 'react-i18next';
import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";
import {servePublicAsset} from "../../services/General/GeneralServices.jsx"

function KindergartenInternationalAcademics() {
    const { t } = useTranslation(['academics-pages']);

    return (
        <div className={"kindergarten-academics-page"}>
            <Helmet>
                <title>Harvest International School | International KG Academics</title>
                <meta name="description" content="Learn more about the Kindergarten academics at Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Kindergarten, Academics, American, National, British, Partners, Staff, Facilities,  مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق، رياض الأطفال، رياض الاطفال"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <ParallaxScrollSection
                backgroundImage={servePublicAsset("/images/AcademicsPages/InternationalKindergartenAcademicsPageHeader1.jpg")}
                darken={true}
                image={servePublicAsset("/images/AcademicsPages/OpeningQuote.png")}
                imageAlt={"Academics Page Header Opening Quote"}
            />

            <div className={"standard-padding-container"}>
                <p>
                    {t("academics-pages.kindergarten.international-kindergarten-intro-paragraph")}
                </p>
                <p>
                    {t("academics-pages.kindergarten.international-kindergarten-departments-paragraph")}
                </p>
            </div>

            <ParallaxScrollSection backgroundImage={servePublicAsset("/images/AcademicsPages/InternationalKindergartenAcademicsPageMiddle1.jpg")}/>

            <div className={"standard-padding-container"}>
                <p>
                    {t("academics-pages.kindergarten.international-kindergarten-team-paragraph")}
                </p>
                <p>
                    {t("academics-pages.kindergarten.international-kindergarten-outro-paragraph")}
                </p>
            </div>

            <ParallaxScrollSection
                backgroundImage={servePublicAsset("/images/AcademicsPages/InternationalKindergartenAcademicsPageFooter1.jpg")}
                darken={true}
                text={t("academics-pages.kindergarten.quote-by-ms-reham-sardina-head-of-kindergarten-department")}
                image={servePublicAsset("/images/AcademicsPages/ClosingQuote.png")}
                imageAlt={"Academics Page Footer Closing Quote"}
            />

        </div>
    );
}

export default KindergartenInternationalAcademics;