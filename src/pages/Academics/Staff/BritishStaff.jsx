import '../../../styles/Academics.css';
import StaffList from "../../../modules/StaffList.jsx";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function BritishStaff() {
    const { t } = useTranslation(['academics-pages']);

    return (
        <>
            <Helmet>
                <title>{t('academics-pages.british-section')} | {t('nav.staff', {ns: 'nav'})}</title>
                <meta name="description"
                      content="Learn more about the British Division Staff members, teachers, coordinators, and administrative staff at Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords"
                      content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <StaffList departmentKey={"british"}
                       title={t('academics-pages.staff.british-staff-title')}
                       className={"academics-british-staff-page"}
            />
        </>
    );
}

export default BritishStaff;
