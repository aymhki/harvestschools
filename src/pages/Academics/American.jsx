import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";
import '../../styles/Academics.css';
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function American() {
    const {t} = useTranslation()

  return (
      <div className={"american-academics-page"}>
          <Helmet>
              <title>Harvest International School | American</title>
              <meta name="description" content="Learn more about the American academics, the curriculum, and facilities for the American Division at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <ParallaxScrollSection backgroundImage={"../../assets/images/AcademicsPages/AmericanAcademicsPageHeader.jpg"}
                                 title={t("academics-pages.american.dear-harvest-international-school-families")}
                                 darken={true} image={"../../assets/images/AcademicsPages/OpeningQuote.png"}
                                 imageAlt={"American Academics Page Header Opening Quote"}
          />

          <div className={"standard-padding-container"}>
              <p>{t("academics-pages.american.welcome-paragraph")}</p>
              <p>{t("academics-pages.american.principal-introduction")}</p>
          </div>

          <ParallaxScrollSection backgroundImage={"../../assets/images/AcademicsPages/AmericanAcademicsPageMiddle1.jpg"}/>

          <div className={"standard-padding-container"}>
              <p>{t("academics-pages.american.upper-school-description")}</p>
              <p>{t("academics-pages.american.curriculum-standards")}</p>
              <p>{t("academics-pages.american.values-and-goals")}</p>
          </div>

          <ParallaxScrollSection backgroundImage={"../../assets/images/AcademicsPages/AmericanAcademicsPageMiddle2.jpg"}/>

          <div className={"standard-padding-container"}>
              <p>{t("academics-pages.american.community-description")}</p>
              <p>{t("academics-pages.american.lower-middle-school-description")}</p>
          </div>

          <ParallaxScrollSection backgroundImage={"../../assets/images/AcademicsPages/AmericanAcademicsPageFooter.jpg"} text={t("academics-pages.american.quote-by-ms-salma-ehab-american-school-principal")} darken={true} image={"../../assets/images/AcademicsPages/ClosingQuote.png"} imageAlt={"American Academics Page Footer Closing Quote"}/>

      </div>
);
}

export default American;