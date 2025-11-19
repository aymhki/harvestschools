import '../../../styles/Academics.css';
import Table from "../../../modules/Table.jsx";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function KindergartenStaff() {
    const { t, i18n } = useTranslation();

    const staffList = t('academics-pages.staff.kindergarten-staff-list', { returnObjects: true }) || [];

    const tableHeaders = [
        t('academics-pages.staff.name-column-header'),
        t('academics-pages.staff.subject-column-header'),
        t('academics-pages.staff.title-column-header')
    ];

    const tableRows = Array.isArray(staffList) ? staffList.slice(2).map(member => [member.name, member.subject, member.title]) : [];
    const tableData = [tableHeaders, ...tableRows];

    const lastUpdatedDate = new Date('2021-06-20');
    const formattedDate = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Africa/Cairo'
    }).format(lastUpdatedDate);

    return (
        <div className="academics-kindergarten-staff-page">
            <Helmet>
                <title>{t('academics-pages.staff.kindergarten-option')} | {t('nav.staff')}</title>
                <meta name="description"
                      content="Learn more about the Kindergarten Division Staff members, teachers, coordinators, and administrative staff at Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords"
                      content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <div className={"extreme-padding-container"}>
                <h1>{t('academics-pages.staff.kindergarten-staff-title')}</h1>

                <p>
                    {t('academics-pages.staff.head-of-department-feminine')}: {Array.isArray(staffList) && staffList.length > 0 ? staffList[0].name : ''}
                </p>

                <p>
                    {t('academics-pages.staff.vice-feminine')}: {Array.isArray(staffList) && staffList.length > 1 ? staffList[1].name : ''}
                </p>

                <Table tableData={tableData} numCols={3}
                       sortConfigParam={{column: 1, direction: 'ascending'}}/>

                <p>
                    {t('common.last-updated')} {formattedDate}
                </p>
            </div>
        </div>
    );
}

export default KindergartenStaff;