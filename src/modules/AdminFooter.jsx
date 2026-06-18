import { useTranslation } from 'react-i18next';
import '../styles/AdminFooter.css';
import '../styles/Footer.css'

function AdminFooter() {
    const { t } = useTranslation(['footer']);
    const currentYear = new Date().getFullYear();

    return (
        <div className="admin-footer">
            <div className="admin-copy-right-text">
                {t("footer.all-rights-reserved", { year: currentYear })}.
            </div>
        </div>
    );
}

export default AdminFooter;