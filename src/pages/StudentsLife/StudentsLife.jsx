import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/StudentsLife.css';
import {Helmet} from "react-helmet";

function StudentsLife() {

  const options = [
    {
        title: "Students Union",
        image: "/assets/images/StudentsLifePages/StudentsUnion1.png",
        description: "Information about the students union.",
        link: "/students-life/students-union",
        buttonText: "Learn More",
        titleInArabic: false,
        descriptionInArabic: false
    },
    {
        title: "Library",
        image: "/assets/images/StudentsLifePages/Library1.png",
        description: "Information about the library.",
        link: "/students-life/library",
        buttonText: "Learn More",
        titleInArabic: false,
        descriptionInArabic: false
    },
    {
        title: "Activities",
        image: "/assets/images/StudentsLifePages/Activities1.png",
        description: "Information about the activities.",
        link: "/students-life/activities",
        buttonText: "Learn More",
        titleInArabic: false,
        descriptionInArabic: false
    }
  ];

  return (
    <div className={"students-life-page"}>
        <Helmet>
            <title>Harvest International School | Students Life</title>
            <meta name="description"
                  content="Learn more about the Students Life in terms of the activities, facilities, Libraries, clubs, and events at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <OptionsGrid title="Students Life" titleInArabic={false} options={options}/>
    </div>
  );
}

export default StudentsLife;
