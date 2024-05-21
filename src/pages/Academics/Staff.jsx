import FullPageOptionsSelector from "../../modules/FullPageOptionsSelector.jsx";

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

        <FullPageOptionsSelector options={options} />
  );
}

export default Staff;