import '../styles/CorporateApp.css';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

import NavigationBar from "../modules/CorporateNavigationBar.jsx";
import Footer from "../modules/CorporateFooter.jsx";
import ErrorBoundary from "../modules/ErrorBoundary.jsx";
import Home from '../pages/CorporateHome.jsx';
import NotFound from '../pages/NotFound.jsx';

function CorporateServerRouter() {
    const location = useLocation();
    const { i18n } = useTranslation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const langParam = searchParams.get('lang');
        if (langParam && ['en', 'ar'].includes(langParam)) {
            if (i18n.language !== langParam) {
                i18n.changeLanguage(langParam);
            }
        }
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [location.search, i18n]);


    return (
        <div className="App">
            <NavigationBar compactOrAdmin={false} isMobileApp={false}/>
            <div className="content">
                <ErrorBoundary ignoreLngUpdate={false}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </ErrorBoundary>
            </div>
            <Footer />
        </div>
    );
}

export default CorporateServerRouter;