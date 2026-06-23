import {Helmet} from "react-helmet-async";
import OptionsGrid from "../../../modules/OptionsGrid.jsx";
import '../../../styles/StudentsLife.css'
import {useTranslation} from "react-i18next";

function Library() {
    const { t } = useTranslation(['students-life-pages']);

    const arabicLibraryOptions = [
        {
            title: t("students-life-pages.library-pages.main-library-page.arabic-books-options.educational-option"),
            image: "/images/StudentsLifePages/Informative1.png",
            description: t("students-life-pages.library-pages.main-library-page.arabic-books-options.educational-option-description"),
            link: "/students-life/library/arabic-information",
            buttonText: t("common.select", {ns: 'common'}),
            titleInArabic: true,
            descriptionInArabic: true

        },
        {
            title: t("students-life-pages.library-pages.main-library-page.arabic-books-options.general-option"),
            image: "/images/StudentsLifePages/General1.png",
            description: t("students-life-pages.library-pages.main-library-page.arabic-books-options.general-option-description"),
            link: "/students-life/library/arabic-general",
            buttonText: t("common.select", {ns: 'common'}),
            titleInArabic: true,
            descriptionInArabic: true
        },
        {
            title: t("students-life-pages.library-pages.main-library-page.arabic-books-options.stories-option"),
            image: "/images/StudentsLifePages/Tales1.png",
            description: t("students-life-pages.library-pages.main-library-page.arabic-books-options.stories-option-description"),
            link: "/students-life/library/arabic-stories",
            buttonText: t("common.select", {ns: 'common'}),
            titleInArabic: true,
            descriptionInArabic: true
        },
        {
            title: t("students-life-pages.library-pages.main-library-page.arabic-books-options.religious-option"),
            image: "/images/StudentsLifePages/Religious1.png",
            description: t("students-life-pages.library-pages.main-library-page.arabic-books-options.religious-option-description"),
            link: "/students-life/library/arabic-religion",
            buttonText: t("common.select", {ns: 'common'}),
            titleInArabic: true,
            descriptionInArabic: true

        }
    ];

    const englishLibraryOptions = [
        {
            title: t("students-life-pages.library-pages.main-library-page.english-books-options.fairy-tales-option"),
            image: "/images/StudentsLifePages/Tales2.png",
            description: t("students-life-pages.library-pages.main-library-page.english-books-options.fairy-tales-option-description"),
            link: "/students-life/library/english-fairy-tales",
            buttonText: t("common.select", {ns: 'common'}),
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: t("students-life-pages.library-pages.main-library-page.english-books-options.drama-option"),
            image: "/images/StudentsLifePages/Drama1.png",
            description: t("students-life-pages.library-pages.main-library-page.english-books-options.drama-option-description"),
            link: "/students-life/library/english-drama",
            buttonText: t("common.select", {ns: 'common'}),
            titleInArabic: false,
            descriptionInArabic: false

        },
        {
            title: t("students-life-pages.library-pages.main-library-page.english-books-options.levels-option"),
            image: "/images/StudentsLifePages/Levels1.png",
            description: t("students-life-pages.library-pages.main-library-page.english-books-options.levels-option-description"),
            link: "/students-life/library/english-levels",
            buttonText: t("common.select", {ns: 'common'}),
        },
        {
            title: t("students-life-pages.library-pages.main-library-page.english-books-options.general-option"),
            image: "/images/StudentsLifePages/General1.png",
            description: t("students-life-pages.library-pages.main-library-page.english-books-options.general-option-description"),
            link: "/students-life/library/english-general",
            buttonText: t("common.select", {ns: 'common'}),
            titleInArabic: false,
            descriptionInArabic: false
        }
    ];

  return (
      <>
          <div className={"students-life-library-page"}>
              <Helmet>
                  <title>Harvest International School | Library</title>
                  <meta name="description" content="Choose your preferred language to learn more about the libraries content at Harvest International School in Borg El Arab, Egypt."/>
                  <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
                  <meta name="author" content="Harvest International School"/>
                  <meta name="robots" content="index, follow"/>
                  <meta name="googlebot" content="index, follow"/>
              </Helmet>

              <OptionsGrid options={englishLibraryOptions} title={t("students-life-pages.library-pages.main-library-page.english-books-title")} thisOptionsGridIsNotAloneInThePage={true} />

              <OptionsGrid options={arabicLibraryOptions} title={t("students-life-pages.library-pages.main-library-page.arabic-books-title")} thisOptionsGridIsNotAloneInThePage={true} />
          </div>
      </>
  );
}

export default Library;