import OptionsGrid from "../../../modules/OptionsGrid.jsx";
import '../../../styles/StudentsLife.css';
import {Helmet} from "react-helmet";

function EnglishLibrary() {
    const options = [
        {
            title: "Fairy Tales",
            image: "/assets/images/StudentsLifePages/Tales2.png",
            description: "Read classic fairy tales.",
            link: "/students-life/library/english-fairy-tales",
            buttonText: "Select",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "Drama",
            image: "/assets/images/StudentsLifePages/Drama1.png",
            description: "Read drama books.",
            link: "/students-life/library/english-drama",
            buttonText: "Select",
            titleInArabic: false,
            descriptionInArabic: false

        },
        {
            title: "Levels",
            image: "/assets/images/StudentsLifePages/Levels1.png",
            description: "Read books based on your reading level.",
            link: "/students-life/library/english-levels",
            buttonText: "Select",
        },
        {
            title: "General",
            image: "/assets/images/StudentsLifePages/General1.png",
            description: "Read general books.",
            link: "/students-life/library/english-general",
            buttonText: "Select",
            titleInArabic: false,
            descriptionInArabic: false
        }
    ];

  return (
    <div className={"english-library-page"}>
        <Helmet>
            <title>Harvest International School | English Library</title>
            <meta name="description"
                  content="Choose the category of books you would like to read in the English library at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <OptionsGrid title="Choose A Category" titleInArabic={false} options={options}/>
    </div>
  );
}

export default EnglishLibrary;