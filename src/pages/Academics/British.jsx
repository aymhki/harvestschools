import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";
import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";


function British() {

    const { t } = useTranslation();

  return (
    <div className={"british-academics-page"}>
        <Helmet>
            <title>Harvest International School | British Academics</title>
            <meta name="description" content="Learn more about the British academics, the curriculum, and facilities for the British Division at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <ParallaxScrollSection
            backgroundImage={"../../assets/images/AcademicsPages/BritishAcademicsPageHeader1.jpg"}
            darken={true}
            image={"../../assets/images/AcademicsPages/OpeningQuote.png"}
            imageAlt={"Academics Page Header Opening Quote"}
        />

        <div className={"standard-padding-container"}>
            <h2>
                {t("academics-pages.british.vision-of-the-british-department-title")}
            </h2>
            <p>
                {t("academics-pages.british.vision-of-the-british-department-paragraph")}
            </p>
            <p>
                {t("academics-pages.british.vision-of-the-british-department-extension-paragraph")}
            </p>
        </div>

        <div className={"standard-padding-container"}>
            <h2>
                {t("academics-pages.british.mission-of-the-british-department-title")}
            </h2>
            <p>
                {t("academics-pages.british.mission-of-the-british-department-paragraph")}
            </p>
            <p>
                {t("academics-pages.british.mission-of-the-british-department-extension-paragraph")}
            </p>
        </div>

        <ParallaxScrollSection backgroundImage={"../../assets/images/AcademicsPages/BritishAcademicsPageMiddle1.jpg"}/>


        <div className={"standard-padding-container"}>
            <p>
                {t("academics-pages.british.to-provide-intro")}:
            </p>
            <ul>
                {t("academics-pages.british.to-provide-list", { returnObjects: true }).map((item, index) => (
                    <li key={index}>
                        <p>
                            {item}
                        </p>
                    </li>
                ))}
            </ul>

            <p>
                {t("academics-pages.british.to-provide-outro")}
            </p>
        </div>


        <div className={"standard-padding-container"}>
            <h2>
                {t("academics-pages.british.core-values-title")}
            </h2>

            <p>
                {t("academics-pages.british.core-values-intro")}:
            </p>

            <ul>
                {t("academics-pages.british.core-values-list", { returnObjects: true }).map((item, index) => (
                    <li key={index}>
                        <p>
                            {item}
                        </p>
                    </li>
                ))}
            </ul>

        </div>

        <ParallaxScrollSection backgroundImage={"../../assets/images/AcademicsPages/BritishAcademicsPageMiddle2.jpg"}/>

        <div className={"standard-padding-container"}>
            <h2>
                {t("academics-pages.british.why-choose-our-british-department-title")}
            </h2>

            <p>
                {t("academics-pages.british.why-choose-our-british-department-intro")}:
            </p>

            <ul>
                {t("academics-pages.british.why-choose-our-british-department-list", {returnObjects: true}).map((item, index) => (
                    <li key={index}>
                        <p>
                            {item}
                        </p>
                    </li>
                ))}
            </ul>

        </div>

        <div className={"standard-padding-container"}>
            <p>
                {t("academics-pages.british.final-thoughts-paragraph")}
            </p>
        </div>

        <ParallaxScrollSection
            backgroundImage={"../../assets/images/AcademicsPages/BritishAcademicsPageFooter1.jpg"}
            darken={true}
            text={t("academics-pages.british.quote-by-ms-marwa-elsobky-british-school-head")}
            image={"../../assets/images/AcademicsPages/ClosingQuote.png"}
            imageAlt={"Academics Page Footer Closing Quote"}
        />
    </div>
  );
}

export default British;