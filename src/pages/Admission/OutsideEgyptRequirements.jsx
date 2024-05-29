import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";
import '../../styles/Admission.css'

function OutsideEgyptRequirements() {
  return (
      <div className="admission-outside-egypt-page">
          <ParallaxScrollSection
              backgroundImage={'/assets/images/AdmissionPages/OutsideEgyptRequirementsHeaderBackground.png'}
              title={"Admission Requirements Note"} titleInArabic={false}
              darken={true}
              divElements={[(
                  <div className="admission-requirements-note" key={1}>
                      <ul className={"admission-note-list"}>
                          <li>
                              <p>
                                  After passing the entry tests, the following documents will be requested for the
                                  registration process.
                              </p>
                          </li>

                          <li>
                              <p>
                                  The National and the International Departments request the same documents. However, students applying for the International department in upper stages should provide educational Sequence certificates stamped by the Egyptian Ministry of Foreign Affairs.
                              </p>
                          </li>

                          <li>
                              <p>
                                  After taking official acceptance from the student affairs department parents should fill (Returning Egypt Form) from the Egyptian Ministry of Foreign Affairs. This form requires 2 personal Photos and a certificate of the last stage the student passed
                              </p>
                          </li>

                      </ul>
                  </div>
              )]}
          />

          <container className="extreme-padding-container">
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
                                  last stage certificate stamped by the Egyptian Ministry of Foreign Affairs
                              </p>

                          </li>

                          <li>
                              <p>
                                  Student File
                              </p>
                          </li>
                      </ul>
                  </div>

                  <div className={"admission-requirements-list-arabic"}>
                      <ul className={"admission-requirements-list"} lang={"ar"}>
                          <li>
                              <p lang={"ar"}>
                                  بيان نجاح اخر مرحلة مختومة من وزارة الخارجية المصرية
                              </p>
                          </li>

                          <li>
                              <p lang={"ar"}>
                                  ملف الطالب
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
                                  last stage certificate stamped by the Egyptian Ministry of Foreign Affairs
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
                      </ul>
                  </div>

                  <div className={"admission-requirements-list-arabic"}>
                      <ul className={"admission-requirements-list"} lang={"ar"}>
                          <li>
                              <p lang={"ar"}>
                                  بيان نجاح اخر مرحلة مختومة من وزارة الخارجية المصرية
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
                      </ul>
                  </div>
              </div>

              <h1>From Senior 1 to Senior 3</h1>
              <div className="admission-requirements-list-container">

                  <div className="admission-requirements-list-english">
                      <ul className={"admission-requirements-list"}>
                          <li>
                              <p>
                                  last stage certificate stamped by the Egyptian Ministry of Foreign Affairs
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
                      </ul>
                  </div>

                  <div className={"admission-requirements-list-arabic"}>
                      <ul className={"admission-requirements-list"} lang={"ar"}>
                          <li>
                              <p lang={"ar"}>
                                  بيان نجاح اخر مرحلة مختومة من وزارة الخارجية المصرية
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
                      </ul>
                  </div>
              </div>
          </container>
      </div>
  );
}

export default OutsideEgyptRequirements;