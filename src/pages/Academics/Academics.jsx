import '../../styles/Academics.css';
import OptionsGrid from "../../modules/OptionsGrid.jsx";
import {Helmet} from "react-helmet-async";
import { useTranslation } from 'react-i18next';


function Academics() {

    const { t } = useTranslation();

    const options = [
        {
            title: t("academics-pages.national-section"),
            image: "/assets/images/AcademicsPages/National1.png",
            description: t("academics-pages.national-description"),
            link: "/academics/national",
            buttonText: t("common.learn-more"),
        },
        {
            title: t("academics-pages.british-section"),
            image: "/assets/images/AcademicsPages/British1.png",
            description: t("academics-pages.british-description"),
            link: "/academics/british",
            buttonText: t("common.learn-more"),
        },
        {
            title: t("academics-pages.american-section"),
            image: "/assets/images/AcademicsPages/American1.png",
            description: t("academics-pages.american-description"),
            link: "/academics/american",
            buttonText: t("common.learn-more"),
        },
        {
            title: t("nav.partners"),
            image: "/assets/images/AcademicsPages/Partners1.png",
            description: t("academics-pages.partners-description"),
            link: "/academics/partners",
            buttonText: t("common.learn-more"),
        },
        {
            title: t("nav.staff"),
            image: "/assets/images/AcademicsPages/Staff1.png",
            description: t("academics-pages.staff-description"),
            link: "/academics/staff",
            buttonText: t("common.learn-more"),
        },
        {
            title: t("nav.facilities"),
            image: "/assets/images/AcademicsPages/Facilities1.png",
            description: t("academics-pages.facilities-description"),
            link: "/academics/facilities",
            buttonText: t("common.learn-more"),
        },
        {
            title: t("nav.web-mail"),
            image: "/assets/images/AcademicsPages/WebMail1.png",
            description: t("academics-pages.web-mail-description"),
            link: "https://mail.harvestschools.com:2096/",
            buttonText: t("common.learn-more"),
            externalLink: true
        },
        {
            title: t("nav.admin-login"),
            image: "/assets/images/AcademicsPages/Login1.png",
            description: t("academics-pages.admin-login-description"),
            link: "/admin/login",
            buttonText: t("common.learn-more"),
        }
    ];

  return (
    <div className="academics-page">
        <Helmet>
            <title>Harvest International School | Academics</title>
            <meta name="description" content="Learn more about the American, National, and British academics, the curriculums, partners, staff, and facilities at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <OptionsGrid title={t("nav.academics")}  options={options}/>

    </div>
  );
}

export default Academics;