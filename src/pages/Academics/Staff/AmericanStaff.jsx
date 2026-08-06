import '../../../styles/Academics.css';
import StaffList from "../../../modules/StaffList.jsx";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function AmericanStaff() {
    const { t } = useTranslation(['academics-pages']);

    return (
        <>
            <Helmet>
                <title>{t('academics-pages.american-section')} | {t('nav.staff', {ns: 'nav'})}</title>
                <meta name="description"
                      content="Learn more about the American Division Staff members, teachers, coordinators, and administrative staff at Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords"
                      content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <StaffList departmentKey={"american"}
                       title={t('academics-pages.staff.american-staff-title')}
                       className={"academics-american-staff-page"}
            />
        </>
    );
}

export default AmericanStaff;
