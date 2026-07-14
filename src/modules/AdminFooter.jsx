import { useTranslation } from 'react-i18next';
import '../styles/AdminFooter.css';
import '../styles/Footer.css'

function AdminFooter() {
    const { t } = useTranslation(['footer'], {lng: 'en'});
    const currentYear = new Date().getFullYear();

    return (
        <div className="corporate-footer">
            <div className="corporate-copy-right-text">
                {t("footer.all-rights-reserved", { year: currentYear})}.
            </div>
        </div>
    );
}

export default AdminFooter;