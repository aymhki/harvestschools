import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/LanguageSwitcher.css'
import { useState, useEffect } from 'react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        }

        handleResize();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        }

    }, []);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);

        const searchParams = new URLSearchParams(location.search);
        searchParams.set('lang', lng);

        navigate({
            pathname: location.pathname,
            search: searchParams.toString()
        }, { replace: true });

        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lng;
    };

    return (
        <div className="language-switcher">

            <div onClick={() => changeLanguage('en')}
                 className={`en ${i18n.language === 'en' ? 'active' : ''} ${isMobile ? 'mobile' : ''}`}
            >
                English
            </div>

            <span className={`language-switcher-separator ${isMobile ? 'mobile' : ''}`}>
                /
            </span>

            <div
                onClick={() => changeLanguage('ar')}
                className={`ar ${i18n.language === 'ar' ? 'active' : ''} ${isMobile ? 'mobile' : ''}`}
            >
                العربية
            </div>

        </div>
    );
};

export default LanguageSwitcher;
