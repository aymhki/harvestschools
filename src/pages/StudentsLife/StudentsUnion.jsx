import '../../styles/StudentsLife.css'
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function StudentsUnion() {
    const {t, i18n} = useTranslation();

    const lastUpdatedDate = new Date('2019-06-07');
    const formattedDate = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Africa/Cairo'
    }).format(lastUpdatedDate);

    return (
        <div className={"students-life-students-union-page"}>
            <Helmet>
                <title>Harvest International School | Students Union</title>
                <meta name="description" content="Learn more about the Students Union requirements, duties, benefits, and members at Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <div className={"extreme-padding-container"}>

                <h1>
                    {t("students-life-pages.students-union-page.students-union-title")}
                </h1>

            <h2>
                {t("students-life-pages.students-union-page.how-can-i-join-the-students-union-question")}
            </h2>
                <p>
                    {t("students-life-pages.students-union-page.how-can-i-join-the-students-union-answer")}
                </p>

                <h2>
                    {t("students-life-pages.students-union-page.what-are-the-students-union-duties-question")}
                </h2>

                <ul className={"students-union-duties-list"}>
                    {t("students-life-pages.students-union-page.what-are-the-students-union-duties-answer", {returnObjects: true}).map((duty, index) => (
                        <li key={index}>
                            <p>
                                {duty}
                            </p>
                        </li>
                    ))}
                </ul>

                <p>
                    {t("common.and-more")}
                </p>

                <h2>
                    {t("students-life-pages.students-union-page.what-are-the-students-union-benefits-question")}
                </h2>

                <ul className={"students-union-benefits-list"}>
                    {t("students-life-pages.students-union-page.what-are-the-students-union-benefits-answer", {returnObjects: true}).map((benefit, index) => (
                        <li key={index}>
                            <p>
                                {benefit}
                            </p>
                        </li>
                    ))}
                </ul>

                <p>
                    {t("common.and-more")}
                </p>

                <h2>
                    {t("students-life-pages.students-union-page.who-are-the-students-union-members-right-now-question")}
                </h2>

                <ul className={"students-union-members-list"}>
                    {t("students-life-pages.students-union-page.who-are-the-students-union-members-right-now-answer", {returnObjects: true}).map((member, index) => (
                        <li key={index}>
                            <p>
                                {member}
                            </p>
                        </li>
                    ))}
                </ul>

                <p>
                    {t('common.last-updated')} {formattedDate}
                </p>
            </div>
        </div>
    )
}

export default StudentsUnion;