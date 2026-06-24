import { useTranslation } from 'react-i18next';
import '../styles/LanguageSwitcher.css'
import { useState, useEffect } from 'react';
import {useToggleLanguage} from "../services/General/GeneralUtils.jsx";

const LanguageSwitcher = () => {
    const toggleLanguage = useToggleLanguage();
    const { i18n } = useTranslation();
    const [isMobile, setIsMobile] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        }

        handleResize();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        }

    }, []);

    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
    }, [])


    return (
        <div className="language-switcher">

            <div onClick={() => toggleLanguage({lng: 'en', ignoreDocUpdate: false} )}
                 className={`en ${(i18n.language === 'en' || i18n.language !== 'ar') ? 'active' : ''} ${isMobile ? 'mobile' : ''}`}
            >
                English
            </div>

            <span className={`language-switcher-separator ${isMobile ? 'mobile' : ''}`}>
                /
            </span>

            <div
                onClick={() => toggleLanguage({lng: 'ar', ignoreDocUpdate: false} )}
                className={`ar ${i18n.language === 'ar' ? 'active' : ''} ${isMobile ? 'mobile' : ''}`}
            >
                العربية
            </div>

        </div>
    );
};

export default LanguageSwitcher;
