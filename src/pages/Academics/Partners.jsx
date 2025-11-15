import '../../styles/Academics.css';
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";


function Partners() {

    const { t } = useTranslation();

  return (
      <div className={"academics-partners-page"}>
          <Helmet>
              <title>Harvest International School | Partners</title>
              <meta name="description" content="Learn more about the Partners of Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <div className="extreme-padding-container">
              <img src={'../../assets/images/AcademicsPages/Partners1.png'}/>
              <h1>{t('academics-pages.partners.schooleverywhere-title')}</h1>
              <p>{t('academics-pages.partners.schooleverywhere-description')}</p>
              <img src={'../../assets/images/AcademicsPages/Partners2.png'}/>
              <h1>{t('academics-pages.partners.ucmas-title')}</h1>
              <p>{t('academics-pages.partners.ucmas-description')}</p>
          </div>

      </div>
  );
}

export default Partners;