import FullPageOptionsSelector from "../../modules/FullPageOptionsSelector.jsx";
import {Helmet} from "react-helmet-async";

function Staff() {

    const options = [

        {
            text: "National",
            link: "/academics/staff/national-staff",
            inArabic: false,
            isAssetLink: false
        },
        {
            text: "British",
            link: "/academics/staff/british-staff",
            inArabic: false,
            isAssetLink: false
        },
        {
            text: "American",
            link: "/academics/staff/american-staff",
            inArabic: false,
            isAssetLink: false
        },
        {
            text: "KG",
            link: "/academics/staff/kindergarten-staff",
            inArabic: false,
            isAssetLink: false
        }
    ];

  return (

      <>
          <Helmet>
              <title>Harvest International School | Staff</title>
              <meta name="description"
                    content="Learn more about the Staff members, teachers, coordinators, and administrative staff at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords"
                    content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <FullPageOptionsSelector options={options} />
      </>

  );
}

export default Staff;
