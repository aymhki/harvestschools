import { useTranslation } from 'react-i18next';
import '../styles/CorporateFooter.css'

function CorporateFooter() {
    const { t, i18n } = useTranslation(['corporate-footer']);
    const currentYear =  new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { useGrouping: false }).format(new Date().getFullYear());

    return (
        <div className="corporate-footer">
            <div className="corporate-copy-right-text">
                {t("corporate-footer.all-rights-reserved", { year: currentYear})}.
            </div>
        </div>
    );
}

export default CorporateFooter;