import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/StudentsLife.css';

function StudentsLife() {

  const options = [
    {
        title: "Students Union",
        image: "/assets/images/StudentsLifePages/StudentsUnion1.png",
        description: "Information about the students union.",
        link: "/students-life/students-union",
        buttonText: "Learn More"
    },
    {
        title: "Library",
        image: "/assets/images/StudentsLifePages/Library1.png",
        description: "Information about the library.",
        link: "/students-life/library",
        buttonText: "Learn More"
    },
    {
        title: "Activities",
        image: "/assets/images/StudentsLifePages/Activities1.png",
        description: "Information about the activities.",
        link: "/students-life/activities",
        buttonText: "Learn More"
    }
  ];

  return (
    <div className={"students-life-page"}>
        <OptionsGrid title="Students Life" options={options}/>
    </div>
  );
}

export default StudentsLife;
