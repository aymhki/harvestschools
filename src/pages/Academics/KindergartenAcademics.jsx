import '../../styles/Academics.css';
import OptionsGrid from "../../modules/OptionsGrid.jsx";
import {Helmet} from "react-helmet-async";
import { useTranslation } from 'react-i18next';

function KindergartenAcademics() {
    const { t } = useTranslation();

    const options = [
        {
            title: t("academics-pages.kindergarten.national-kindergarten-option"),
            image: "/assets/images/AcademicsPages/National2.png",
            description: t("academics-pages.kindergarten.national-kindergarten-description"),
            link: "/academics/kindergarten-national",
            buttonText: t("common.learn-more"),
        },
        {
            title: t("academics-pages.kindergarten.international-kindergarten-option"),
            image: "/assets/images/AcademicsPages/International1.png",
            description: t("academics-pages.kindergarten.international-kindergarten-description"),
            link: "/academics/kindergarten-international",
            buttonText: t("common.learn-more"),
        },
        {
            title: t("academics-pages.kindergarten.pre-kindergarten-option"),
            image: "/assets/images/AcademicsPages/Pre-K1.png",
            description: t("academics-pages.kindergarten.pre-kindergarten-description"),
            link: "/academics/pre-kindergarten",
            buttonText: t("common.learn-more"),
        }
    ]

    return (
        <div className="academics-page">
            <Helmet>
                <title>Harvest International School | KG Academics</title>
                <meta name="description" content="Learn more about the Kindergarten academics at Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Kindergarten, Academics, American, National, British, Partners, Staff, Facilities,  مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق، رياض الأطفال، رياض الاطفال"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <OptionsGrid title={t("nav.kindergarten")}  options={options}/>
        </div>
    );
}

export default KindergartenAcademics;