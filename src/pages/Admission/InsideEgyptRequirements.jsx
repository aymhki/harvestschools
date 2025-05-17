import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";
import '../../styles/Admission.css'
import {Helmet} from "react-helmet-async";


function InsideEgyptRequirements() {
  return (
    <div className="admission-inside-egypt-page">
        <Helmet>
            <title>Harvest International School | Admission Requirements Inside Egypt</title>
            <meta name="description"
                  content="Learn more about what is required from parents and students when applying to transfer from a school within Egypt or applying to schools for the first time"/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Admission, Admission Process, Admission Requirements, Admissione Fees, مصاريف مدارس هارفست، متطلبات القبول، عملية القبول"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <ParallaxScrollSection backgroundImage={'/assets/images/AdmissionPages/InsideEgyptRequirementsHeaderBackground.jpg'} title={"Admission Requirements Note"} titleInArabic={false}
                               darken={true}
               divElements={[(
                   <div className="admission-requirements-note" key={1}>
                        <ul className={"admission-note-list"}>
                            <li>
                                <p>
                                    After passing the entry tests, the following documents will be requested for the registration process.
                                </p>
                            </li>

                            <li>
                                <p>
                                    The National and the International Departments request the same documents. However, students applying for the International department in upper stages should provide educational Sequence certificates
                                </p>
                            </li>

                            <li>
                                <p>
                                    Online transfer is a process done by the School students originally came from
                                </p>
                            </li>

                        </ul>
                   </div>
            )]}
        />

        <div className="extreme-padding-container">
            <h1>From KG 1</h1>
            <div className="admission-requirements-list-container">

                <div className="admission-requirements-list-english">
                    <ul className={"admission-requirements-list"}>
                        <li>
                            <p>
                                Original Birth Certificate
                            </p>
                        </li>
                        <li>
                            <p>
                                6 Personal ID Photos
                            </p>
                        </li>
                        <li>
                            <p>
                                2 Copies From Parent ID Cards
                            </p>
                        </li>
                    </ul>
                </div>

                <div className={"admission-requirements-list-arabic"}>
                    <ul className={"admission-requirements-list"} lang={"ar"}>
                        <li>
                            <p lang={"ar"}>
                                أصل شهادة الميلاد
                            </p>
                        </li>
                        <li>
                            <p lang={"ar"}>
                                ٦ صور شخصية
                            </p>
                        </li>
                        <li>
                            <p lang={"ar"}>
                                ٢ صورة بطاقة ولي الامر
                            </p>
                        </li>
                    </ul>
                </div>
            </div>

            <h1>From KG 2 to Junior 6</h1>
            <div className="admission-requirements-list-container">

                <div className="admission-requirements-list-english">
                    <ul className={"admission-requirements-list"}>
                        <li>
                            <p>
                                Old School transfer form + Stage form
                            </p>

                        </li>

                        <li>
                            <p>
                                Student File
                            </p>
                        </li>

                        <li>
                            <p>
                                Online Transfer
                            </p>
                        </li>
                    </ul>
                </div>

                <div className={"admission-requirements-list-arabic"}>
                    <ul className={"admission-requirements-list"} lang={"ar"}>
                        <li>
                            <p lang={"ar"}>
                                استمارة تحويل من المدرسة المراد التحويل منها + بيان نجاح المرحلة
                            </p>
                        </li>

                        <li>
                            <p lang={"ar"}>
                                ملف الطالب
                            </p>
                        </li>

                        <li>
                            <p lang={"ar"}>
                                تحويل الكتروني
                            </p>
                        </li>

                    </ul>
                </div>

            </div>

            <h1>From Preparatory 1 to Preparatory 3</h1>
            <div className="admission-requirements-list-container">

                    <div className="admission-requirements-list-english">
                        <ul className={"admission-requirements-list"}>
                            <li>
                                <p>
                                    Old School transfer form + Stage form
                                </p>
                            </li>

                            <li>
                                <p>
                                    Grade 6 Certificate
                                </p>
                            </li>

                            <li>
                                <p>
                                    Student File
                                </p>
                            </li>

                            <li>
                                <p>
                                    Online Transfer
                                </p>
                            </li>
                        </ul>
                    </div>

                    <div className={"admission-requirements-list-arabic"}>
                        <ul className={"admission-requirements-list"} lang={"ar"}>
                            <li>
                                <p lang={"ar"}>
                                    استمارة تحويل من المدرسة المراد التحويل منها + بيان نجاح المرحلة
                                </p>
                            </li>

                            <li>
                                <p lang={"ar"}>
                                    شهادة الصف السادس الابتدائي
                                </p>
                            </li>

                            <li>
                                <p lang={"ar"}>
                                    ملف الطالب
                                </p>
                            </li>

                            <li>
                                <p lang={"ar"}>
                                    تحويل الكتروني
                                </p>
                            </li>

                        </ul>
                    </div>
            </div>

            <h1>From Senior 1 to Senior 3</h1>
            <div className="admission-requirements-list-container">

                <div className="admission-requirements-list-english">
                    <ul className={"admission-requirements-list"}>
                        <li>
                            <p>
                                Old School transfer form + Stage form
                            </p>
                        </li>

                        <li>
                            <p>
                                Grade 6 Certificate + Preparatory Certificate
                            </p>
                        </li>

                        <li>
                            <p>
                                Student File
                            </p>
                        </li>

                        <li>
                            <p>
                                Online Transfer
                            </p>
                        </li>
                    </ul>
                </div>

                <div className={"admission-requirements-list-arabic"}>
                    <ul className={"admission-requirements-list"} lang={"ar"}>
                        <li>
                            <p lang={"ar"}>
                                استمارة تحويل من المدرسة المراد التحويل منها + بيان نجاح المرحلة
                            </p>
                        </li>

                        <li>
                            <p lang={"ar"}>
                                شهادة الصف السادس الابتدائي + شهادة الصف الثالث الإعدادي
                            </p>
                        </li>

                        <li>
                            <p lang={"ar"}>
                                ملف الطالب
                            </p>
                        </li>

                        <li>
                            <p lang={"ar"}>
                                تحويل الكتروني
                            </p>
                        </li>

                    </ul>
                </div>
            </div>
        </div>
    </div>
);
}

export default InsideEgyptRequirements;