import OptionsGrid from "../../../modules/OptionsGrid.jsx";
import '../../../styles/StudentsLife.css';
import {Helmet} from "react-helmet";

function ArabicLibrary() {
    const options = [
        {
            title: "تعليمية",
            image: "/assets/images/StudentsLifePages/Informative1.png",
            description: ".اقرأ كتب تعليمية",
            link: "/students-life/library/arabic-information",
            buttonText: "اختر",
            titleInArabic: true,
            descriptionInArabic: true

        },
        {
            title: "عامة",
            image: "/assets/images/StudentsLifePages/General1.png",
            description: ".اقرأ كتب عامة",
            link: "/students-life/library/arabic-general",
            buttonText: "اختر",
            titleInArabic: true,
            descriptionInArabic: true
        },
        {
            title: "روايات",
            image: "/assets/images/StudentsLifePages/Tales1.png",
            description: ".اقرأ روايات",
            link: "/students-life/library/arabic-stories",
            buttonText: "اختر",
            titleInArabic: true,
            descriptionInArabic: true
        },
        {
            title: "دينية",
            image: "/assets/images/StudentsLifePages/Religious1.png",
            description: ".اقرأ كتب دينية",
            link: "/students-life/library/arabic-religion",
            buttonText: "اختر",
            titleInArabic: true,
            descriptionInArabic: true


        }
    ];


  return (
    <div className={"arabic-library-page"}>
        <Helmet>
            <title>Harvest International School | Arabic Library</title>
            <meta name="description"
                  content="Choose the category of books you would like to read in the Arabic library at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>
      <OptionsGrid options={options} title="اختر تصنيفًا" titleInArabic={true} />
    </div>
  );
}

export default ArabicLibrary;