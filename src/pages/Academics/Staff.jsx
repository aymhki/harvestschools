import FullPageOptionsSelector from "../../modules/FullPageOptionsSelector.jsx";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function Staff() {
    const { t } = useTranslation();

    const options = [

        {
            text: t("academics-pages.staff.national-option"),
            link: "/academics/staff/national-staff",
            inArabic: false,
            isAssetLink: false
        },
        {
            text: t("academics-pages.staff.british-option"),
            link: "/academics/staff/british-staff",
            inArabic: false,
            isAssetLink: false
        },
        {
            text: t("academics-pages.staff.american-option"),
            link: "/academics/staff/american-staff",
            inArabic: false,
            isAssetLink: false
        },
        {
            text: t("academics-pages.staff.kindergarten-option"),
            link: "/academics/staff/kindergarten-staff",
            inArabic: false,
            isAssetLink: false
        }
    ];

  return (

      <>
          <Helmet>
              <title>Harvest International School | Staff</title>
              <meta name="description" content="Learn more about the Staff members, teachers, coordinators, and administrative staff at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <FullPageOptionsSelector options={options} />
      </>

  );
}

export default Staff;
