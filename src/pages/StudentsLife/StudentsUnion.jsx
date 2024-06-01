import '../../styles/StudentsLife.css'
import {Helmet} from "react-helmet";

function StudentsUnion() {
    return (
        <div className={"students-life-students-union-page"}>
            <Helmet>
                <title>Harvest International School | Students Union</title>
                <meta name="description"
                      content="Learn more about the Students Union requirements, duties, benefits, and members at Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords"
                      content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <container className={"extreme-padding-container"}>

                <h1>
                    Students Union
                </h1>

            <h2>How can I join the students union?</h2>
                <p>
                    In order to join the students union, students enrolled in the highest education stages must pass two examination stages created by the current students union, one of which is written (held in classrooms randomly) and the other one is oral held in the meetings room in the national premises. If a student passed the two exams successfully a judging committee consist of head teachers from all the subjects look through the history of all students to filter the best of which can represent the new students union.
                </p>

                <h2>
                    What is the students union duties?
                </h2>

                <ul className={"students-union-duties-list"}>
                    <li>
                        <p>
                            To represent Harvest Schools students outlook and behavior.
                        </p>
                    </li>

                    <li>
                        <p>
                            To provide and protect a healthy environment for the rest of the students during the school time and summer time.
                        </p>
                    </li>

                    <li>
                        <p>
                            To create new ideas that help teachers and administrators in the school management systems.
                        </p>
                    </li>

                    <li>
                        <p>
                            To organize school trips and moderate champions during the year.
                        </p>
                    </li>
                </ul>

                <p>
                    and more...
                </p>

                <h2>
                    What is the students union benefits?
                </h2>

                <ul className={"students-union-benefits-list"}>
                    <li>
                        <p>
                            Special access to all school facilities and resources such as libraries, computer labs, Stationery and Canteen.
                        </p>
                    </li>

                    <li>
                        <p>
                            A decision making voice in meetings related Books, Stationary, and E - Learning devices.
                        </p>
                    </li>

                    <li>
                        <p>
                            Discounts and offers for all school trips and products sold or services used.
                        </p>
                    </li>

                    <li>
                        <p>
                            Leading classrooms in playgrounds, swimming pool and gymnasium for competitions and champions among students.
                        </p>
                    </li>
                </ul>

                <p>
                    and more...
                </p>

                <h2>
                    Who are the students union members right now?
                </h2>

                <ul className={"students-union-members-list"}>
                    <li>
                        <p>
                            From Middle 1: Mariam Mohamed, Darin Ahmed
                        </p>
                    </li>

                    <li>
                        <p>
                            From Year 7: Rehad Hossam, Yehia Mohamed
                        </p>
                    </li>

                    <li>
                        <p>
                            From Year 8: Salma El A, Khaled Ahmed
                        </p>
                    </li>

                    <li>
                        <p>
                            From Middle 2: Adham Ibrahim
                        </p>
                    </li>

                    <li>
                        <p>
                            From Middle 3: Mahmoud Saeed, Farida Sharaf, Habiba Aboraya
                        </p>
                    </li>

                    <li>
                        <p>
                            From Year 9:  Yomna Ghanem, Zeina Ashraf
                        </p>
                    </li>
                </ul>

                <p>
                    This page was last updated in June 7, 2019.
                </p>
            </container>
        </div>
    )
}

export default StudentsUnion;