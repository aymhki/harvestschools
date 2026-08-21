import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/Academics.css';
import {useTranslation} from "react-i18next";

function Staff() {
    const { t } = useTranslation(['academics-pages']);

    const options = [

        {
            title: t("academics-pages.staff.national-option"),
            description: t("academics-pages.staff.national-option-description"),
            image: "/images/AcademicsPages/National1.png",
            link: "/academics/staff/national-staff",
            buttonText: t("common.select", {ns: 'common'}),
        },
        {
            title: t("academics-pages.staff.british-option"),
            description: t("academics-pages.staff.british-option-description"),
            image: "/images/AcademicsPages/British1.png",
            link: "/academics/staff/british-staff",
            buttonText: t("common.select", {ns: 'common'}),
        },
        {
            title: t("academics-pages.staff.american-option"),
            description: t("academics-pages.staff.american-option-description"),
            image: "/images/HomePage/AccreditedCognia.avif",
            link: "/academics/staff/american-staff",
            buttonText: t("common.select", {ns: 'common'}),
        },
        {
            title: t("academics-pages.staff.kindergarten-option"),
            description: t("academics-pages.staff.kindergarten-option-description"),
            image: "/images/AcademicsPages/Kindergarten1.png",
            link: "/academics/staff/kindergarten-staff",
            buttonText: t("common.select", {ns: 'common'}),
        }
    ];

  return (
    <div className="academics-page">
          <title>Harvest International School | Staff</title>
          <meta name="description" content="Learn more about the Staff members, teachers, coordinators, and administrative staff at Harvest International School in Borg El Arab, Egypt."/>
          <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
          <meta name="author" content="Harvest International School"/>
          <meta name="robots" content="index, follow"/>
          <meta name="googlebot" content="index, follow"/>

          <OptionsGrid title={t("nav.staff", {ns: 'nav'})} options={options} compact={true}/>
    </div>
  );
}

export default Staff;
