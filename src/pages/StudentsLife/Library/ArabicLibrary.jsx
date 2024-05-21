import OptionsGrid from "../../../modules/OptionsGrid.jsx";
import '../../../styles/StudentsLife.css';

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
      <OptionsGrid options={options} title="اختر تصنيفًا" titleInArabic={true} />
    </div>
  );
}

export default ArabicLibrary;