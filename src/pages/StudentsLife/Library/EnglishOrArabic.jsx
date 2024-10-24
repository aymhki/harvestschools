import FullPageOptionsSelector from "../../../modules/FullPageOptionsSelector.jsx";
import {Helmet} from "react-helmet";

function EnglishOrArabic() {
    const left = {
        text: "English",
        link: "/students-life/library/english-library",
        inArabic: false,
        isAssetLink: false
    };
    const right = {
        text: "عربي",
        link: "/students-life/library/arabic-library",
        inArabic: true,
        isAssetLink: false
    };

    const options = [left, right];

  return (
      <>
          <Helmet>
              <title>Harvest International School | Library</title>
              <meta name="description"
                    content="Choose your preferred language to learn more about the libraries content at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords"
                    content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <FullPageOptionsSelector options={options} />
      </>
  );
}

export default EnglishOrArabic;