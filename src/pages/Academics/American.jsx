import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";
import '../../styles/Academics.css';
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function American() {
    const {t} = useTranslation()

  return (
      <div className={"american-academics-page"}>
          <Helmet>
              <title>Harvest International School | American Academics</title>
              <meta name="description" content="Learn more about the American academics, the curriculum, and facilities for the American Division at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <ParallaxScrollSection
              backgroundImage={"../../assets/images/AcademicsPages/AmericanAcademicsPageHeader1.jpg"}
              darken={true}
              image={"../../assets/images/AcademicsPages/OpeningQuote.png"}
              imageAlt={"Academics Page Header Opening Quote"}
          />

          <div className={"standard-padding-container"}>
              <p>{t("academics-pages.american.welcome-paragraph")}</p>
              <p>{t("academics-pages.american.believe-paragraph")}</p>
              <p>{t("academics-pages.american.classroom-paragraph")}</p>
          </div>

          <ParallaxScrollSection backgroundImage={"../../assets/images/AcademicsPages/AmericanAcademicsPageMiddle1.v1.jpg"}/>

          <div className={"standard-padding-container"}>
              <p>{t("academics-pages.american.proud-to-offer-title")}:</p>

              <ul className={"american-academics-features-list"}>
                  {t("academics-pages.american.proud-to-offer-list", { returnObjects: true }).map((item, index) => (
                      <li key={index}>
                          <p>
                              {item}
                          </p>
                      </li>
                  ))}
              </ul>

              <p>{t("academics-pages.american.final-thoughts-paragraph")}</p>
              <p>{t("academics-pages.american.goodbye-sentence")}</p>
          </div>

          <ParallaxScrollSection
              backgroundImage={"../../assets/images/AcademicsPages/AmericanAcademicsPageFooter1.jpg"}
              darken={true}
              text={t("academics-pages.american.quote-by-ms-salma-ehab-american-school-head")}
              image={"../../assets/images/AcademicsPages/ClosingQuote.png"}
              imageAlt={"Academics Page Footer Closing Quote"}
          />
      </div>
);
}

export default American;