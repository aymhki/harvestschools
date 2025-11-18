import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/StudentsLife.css';
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function StudentsLife() {
    const {t} = useTranslation();

  const options = [
    {
        title: t("students-life-pages.options-page.students-union-option"),
        image: "/assets/images/StudentsLifePages/StudentsUnion1.png",
        description: t("students-life-pages.options-page.students-union-option-description"),
        link: "/students-life/students-union",
        buttonText: t("common.learn-more"),
        titleInArabic: false,
        descriptionInArabic: false
    },
    {
        title: t("students-life-pages.options-page.library-option"),
        image: "/assets/images/StudentsLifePages/Library1.png",
        description: t("students-life-pages.options-page.library-option-description"),
        link: "/students-life/library",
        buttonText: t("common.learn-more"),
        titleInArabic: false,
        descriptionInArabic: false
    },
    {
        title: t("students-life-pages.options-page.activities-option"),
        image: "/assets/images/StudentsLifePages/Activities1.png",
        description: t("students-life-pages.options-page.activities-option-description"),
        link: "/students-life/activities",
        buttonText: t("common.learn-more"),
        titleInArabic: false,
        descriptionInArabic: false
    }
  ];

  return (
    <div className={"students-life-page"}>
        <Helmet>
            <title>Harvest International School | Students Life</title>
            <meta name="description" content="Learn more about the Students Life in terms of the activities, facilities, Libraries, clubs, and events at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <OptionsGrid title={t("students-life-pages.options-page.students-life-title")} titleInArabic={false} options={options}/>
    </div>
  );
}

export default StudentsLife;
