import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function Covid19() {

    const {t, i18n} = useTranslation();

    return (
        <>
            <div className={"covid-19-read-page"}>
                <Helmet>
                    <title>Harvest International School | Covid-19</title>
                    <meta name="description" content="Learn more about Harvest schools Covid-19 policy in Borg El Arab, Egypt."/>
                    <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Frequently Asked Questions, Questions, FAQ, Answers, Policies, Age Requirements, Covid-19, سؤال وجواب, أسئلة, إجابات, سياسات, متطلبات العمر, كوفيد-19"/>
                    <meta name="author" content="Harvest International School"/>
                    <meta name="robots" content="index, follow"/>
                    <meta name="googlebot" content="index, follow"/>
                </Helmet>

                <div className={"extreme-padding-container"}>
                    <div className={"download-a-copy-of-covid-19-guide-btn-wrapper"}>
                        <button onClick={
                            () => {
                                if (i18n.language === 'en') {
                                    window.open('/assets/documents/Covid-19/Covid-19_Parents_Guide.pdf', '_blank')
                                } else {
                                    window.open('/assets/documents/Covid-19/Covid-19_Parent_Guide_(Arabic).pdf', '_blank');
                                }
                            }
                        }>
                            {t("faqs-pages.covid-19-page.download-copy-btn")}
                        </button>
                    </div>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.intro-title")}
                    </h2>

                    <p className={"covid-19-read-paragraph"}>
                        {t("faqs-pages.covid-19-page.intro-description")}
                    </p>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.commitment-in-providing-emotional-support-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.commitment-in-providing-emotional-support-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>
                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.academic-plan-section.title")}
                    </h2>

                    <p>
                        <strong>
                            {t("faqs-pages.covid-19-page.common.what-should-parents-know")}
                        </strong>
                    </p>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.academic-plan-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>

                                    {
                                        member.sublist && (
                                            <ul className={"covid-19-read-list"}>
                                                {
                                                    member.sublist.map((subpointsMember, subIndex) => (
                                                        <li key={subIndex}>
                                                            <p>
                                                                {subpointsMember.point}
                                                            </p>
                                                        </li>
                                                    ))
                                                }
                                            </ul>
                                        )
                                    }

                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.school-attendance-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.school-attendance-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>
                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.safety-first")}
                    </h2>

                    <p>
                        <strong>
                            {t("faqs-pages.covid-19-page.common.what-should-parents-know")}
                        </strong>
                    </p>


                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.health-and-hygiene-precautions-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.health-and-hygiene-precautions-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>
                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.personal-health-and-safety-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.personal-health-and-safety-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>
                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.social-distancing-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.social-distancing-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>
                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.safety-and-security-measures-for-bus-students.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.safety-and-security-measures-for-bus-students.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>
                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.precautions-inside-the-school")}
                    </h2>

                    <p>
                        <strong>
                            {t("faqs-pages.covid-19-page.common.what-should-parents-know")}
                        </strong>
                    </p>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.the-space-inside-each-class-or-group-and-students-distribution-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.the-space-inside-each-class-or-group-and-students-distribution-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>
                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.the-greatest-usage-of-the-school-facilities-and-resources-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.the-greatest-usage-of-the-school-facilities-and-resources-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>
                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.physical-and-theoretical-activities-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.physical-and-theoretical-activities-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>
                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.break-and-lunch-times-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.break-and-lunch-times-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>
                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.in-case-a-student-show-signs-of-illness-during-the-school-day-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.in-case-a-student-show-signs-of-illness-during-the-school-day-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>
                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.maintaining-the-quality-of-education")}
                    </h2>

                    <p>
                        <strong>
                            {t("faqs-pages.covid-19-page.common.what-should-parents-know")}
                        </strong>
                    </p>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.supporting-the-students-emotional-mental-and-physical-health")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        <li>
                            <p>
                                {t("faqs-pages.covid-19-page.supporting-the-students-emotional-mental-and-physical-health-description")}
                            </p>
                        </li>
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.constant-communication-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.constant-communication-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>
                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.returning-to-school")}
                    </h2>

                    <p>
                        <strong>
                            {t("faqs-pages.covid-19-page.common.what-should-parents-know")}
                        </strong>
                    </p>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.parents-responsibilities-and-tasks.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.parents-responsibilities-and-tasks.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>

                                    {
                                        member.sublist && (
                                            <ul className={"covid-19-read-list"}>
                                                {
                                                    member.sublist.map((subpointsMember, subIndex) => (
                                                        <li key={subIndex}>
                                                            <p>
                                                                {subpointsMember.point}
                                                            </p>
                                                        </li>
                                                    ))
                                                }
                                            </ul>
                                        )
                                    }

                                </li>


                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.daily-precautions-during-the-academic-semester-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.daily-precautions-during-the-academic-semester-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>
                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.the-constant-precautions-to-maintain-the-health-and-safety-of-the-community-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.the-constant-precautions-to-maintain-the-health-and-safety-of-the-community-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>

                                    {
                                        member.sublist && (
                                            <ul className={"covid-19-read-list"}>
                                                {
                                                    member.sublist.map((subpointsMember, subIndex) => (
                                                        <li key={subIndex}>
                                                            <p>
                                                                {subpointsMember.point}
                                                            </p>

                                                            {
                                                                subpointsMember.sublist && (
                                                                    <ul className={"covid-19-read-list"}>
                                                                        {
                                                                            subpointsMember.sublist.map((subSubpointsMember, subSubIndex) => (
                                                                                <li key={subSubIndex}>
                                                                                    <p>
                                                                                        {subSubpointsMember.point}
                                                                                    </p>
                                                                                </li>
                                                                            ))
                                                                        }
                                                                    </ul>
                                                                )
                                                            }

                                                        </li>
                                                    ))
                                                }
                                            </ul>
                                        )
                                    }

                                </li>
                            ))
                        }
                    </ul>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.express-your-worries")}
                    </h2>

                    <p>
                        {t("faqs-pages.covid-19-page.express-your-worries-description")}
                    </p>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.extra-information")}
                    </h2>

                    <p>
                        {t("faqs-pages.covid-19-page.extra-information-description")}

                        <div onClick={() => window.open('https://www.care.gov.eg/EgyptCare/Index.aspx', '_blank')} className={"covid-19-read-link"}>
                            {t("faqs-pages.covid-19-page.common.egypt-care-index-link")}
                        </div>
                    </p>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.applying-to-harvest-schools-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.applying-to-harvest-schools-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>

                                    {
                                        member.sublist && (
                                            <ul className={"covid-19-read-list"}>
                                                {
                                                    member.sublist.map((subpointsMember, subIndex) => (
                                                        <li key={subIndex}>
                                                            <p>
                                                                {subpointsMember.point}
                                                            </p>
                                                        </li>
                                                    ))
                                                }
                                            </ul>
                                        )
                                    }

                                </li>
                            ))
                        }
                    </ul>

                    <p>
                        {t("faqs-pages.covid-19-page.applying-to-harvest-schools-section.for-more-information-about-applying-paragraph")}

                        <div onClick={() => window.open('https://harvestschools.com', '_blank')} className={"covid-19-read-link"}>
                            {t("faqs-pages.covid-19-page.common.harvest-schools-website-link")}
                        </div>

                    </p>

                    <h2 className={"covid-19-read-title"}>
                        {t("faqs-pages.covid-19-page.harvest-schools-contact-information-section.title")}
                    </h2>

                    <ul className={"covid-19-read-list"}>
                        {
                            t("faqs-pages.covid-19-page.harvest-schools-contact-information-section.points", {returnObjects: true}).map((member, index) => (
                                <li key={index}>
                                    <p>
                                        {member.point}
                                    </p>
                                </li>
                            ))
                        }
                    </ul>

                    <div className={"download-a-copy-of-covid-19-guide-btn-wrapper"}>
                        <button onClick={
                            () => {
                                if (i18n.language === 'en') {
                                    window.open('/assets/documents/Covid-19/Covid-19_Parents_Guide.pdf', '_blank')
                                } else {
                                    window.open('/assets/documents/Covid-19/Covid-19_Parent_Guide_(Arabic).pdf', '_blank');
                                }
                            }
                        }>
                            {t("faqs-pages.covid-19-page.download-copy-btn")}
                        </button>
                    </div>

                </div>

            </div>
        </>
    );
}

export default Covid19;