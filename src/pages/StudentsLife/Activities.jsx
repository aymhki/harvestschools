import '../../styles/StudentsLife.css'
import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";
import Table from "../../modules/Table.jsx";
import Form from "../../modules/Form.jsx";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function Activities() {
    const {t} = useTranslation();

    const sportsTimesTableData = t('students-life-pages.activities-page.sports-times-table-data', { returnObjects: true }) || [];
    const tableRows = Array.isArray(sportsTimesTableData) ? sportsTimesTableData.map(member => [member.sports, member.days, member.time]) : [];
    const finalTableData = [...tableRows];

  return (
    <div className={'students-life-activities-page'}>
        <Helmet>
            <title>Harvest International School | Activities</title>
            <meta name="description" content="Learn more about the Activities available for students and partents at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

            <ParallaxScrollSection title={t("students-life-pages.activities-page.activities-page-title")} backgroundImage={'/assets/images/AcademicsPages/AmericanAcademicsPageMiddle1.jpg'} darken={true}
                                   divElements={[
                                       (
                                             <div className={'students-life-activities-page-content'} key={1}>
                                                 <p>
                                                     {t("students-life-pages.activities-page.activities-page-description")} <span onClick={() => window.open('tel:+201062255862')}>{t("students-life-pages.activities-page.contact-number")}</span>
                                                 </p>
                                             </div>
                                       )
                                   ]}
                                   noParallax={false}
            />

        <div className={'extreme-padding-container'}>
            <Table tableData={finalTableData} numCols={3}/>

            <h1>
                {t("students-life-pages.activities-page.enroll-now")}
            </h1>

            <Form sendPdf={false} mailTo={'asmaa.samir@harvestschools.com'} formTitle={'Harvest Academy Enrollment'} fields={[
                {id: 1, type: 'text', label: 'Student Name', displayLabel: t("students-life-pages.activities-page.enroll-now-form-fields.student-name-field"), httpName: 'student-name', required: true, value: '', setValue: null, widthOfField: 3 },
                {id: 2, type: 'tel', label: 'Contact Phone Number', displayLabel: t("students-life-pages.activities-page.enroll-now-form-fields.contact-phone-number-field"), httpName: 'contact-phone-number', required: true, value: '', setValue: null, widthOfField: 3 },
                {id: 3, type: 'date', label: 'Date of Birth', displayLabel: t("students-life-pages.activities-page.enroll-now-form-fields.date-of-birth-field"),  httpName: 'dob', required: true, value: '', setValue: null, widthOfField: 3 , errorMsg: 'Please enter a valid date in the format YYYY-MM-DD' },
                {id: 4, type: 'select', multiple: true, label: 'Select a Sport (You can select more than one)', displayLabel: t("students-life-pages.activities-page.enroll-now-form-fields.select-a-sport-field"), httpName: 'sport', required: true, value: '', setValue: null, widthOfField: 1, choices: [t("students-life-pages.activities-page.enroll-now-form-fields.swimming-option"), t("students-life-pages.activities-page.enroll-now-form-fields.football-option"), t("students-life-pages.activities-page.enroll-now-form-fields.gymnastics-option"), t("students-life-pages.activities-page.enroll-now-form-fields.basketball-option")], labelOutside: true, defaultValue: [] },

            ]} captchaLength={1} lang={'en'}/>


        </div>

    </div>
  );
}

export default Activities;