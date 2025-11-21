import '../../styles/MoreInfo.css'
import Table from "../../modules/Table.jsx";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function MinimumStageAge() {
    const { t, i18n } = useTranslation();
    const lastUpdatedDate = new Date('2023-01-02');
    const formattedDate = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Africa/Cairo'
    }).format(lastUpdatedDate);

    const nationalDivisionMinimumStageAgeTableData = t("faqs-pages.minimum-stage-age-page.national-division-table-data", { returnObjects: true }) || [];
    const nationalTableRows = Array.isArray(nationalDivisionMinimumStageAgeTableData) ? nationalDivisionMinimumStageAgeTableData.map(member => [member.stage, member['minimum-registration-age'] ]) : [];
    const finalNationalTableData = [...nationalTableRows];

    const internationalDivisionMinimumStageAgeTableData = t("faqs-pages.minimum-stage-age-page.international-division-table-data", { returnObjects: true }) || [];
    const internationalTableRows = Array.isArray(internationalDivisionMinimumStageAgeTableData) ? internationalDivisionMinimumStageAgeTableData.map(member => [member.stage, member['minimum-registration-age'] ]) : [];
    const finalInternationalTableData = [...internationalTableRows];

  return (
    <div className={"minimum-stage-age-page"}>
        <Helmet>
            <title>Harvest International School | Minimum Stage Age</title>
            <meta name="description" content="Learn more about the minimum registration age for each stage at each American, British, and National divisions at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Frequently Asked Questions, Questions, FAQ, Answers, Policies, Age Requirements, Covid-19, سؤال وجواب, أسئلة, إجابات, سياسات, متطلبات العمر, كوفيد-19"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <div className={"extreme-padding-container"}>
            <h1>
                {t("faqs-pages.minimum-stage-age-page.title")}
            </h1>
            <p>
                {t("faqs-pages.minimum-stage-age-page.age-requirements-effective-date-notice")}
            </p>

            <Table tableHeader={
                t("faqs-pages.minimum-stage-age-page.national-division-table-header")
            } numCols={2} tableData={finalNationalTableData}/>

            <Table tableHeader={
                t("faqs-pages.minimum-stage-age-page.international-division-table-header")
            } numCols={2} tableData={finalInternationalTableData}/>

            <p>
                {t('common.last-updated')} {formattedDate}
            </p>
        </div>
    </div>
  );
}

export default MinimumStageAge;